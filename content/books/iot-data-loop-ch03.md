---
title: "物联网数据闭环架构设计 - 第3章：多云 K8s 集群与 SaaS 基础设施"
book: "物联网数据闭环架构设计"
chapter: "3"
chapterTitle: "多云 K8s 集群与 SaaS 基础设施"
description: "基于 AWS EKS、GCP GKE、Azure AKS 三云托管的 K8s 集群设计，涵盖全球多区域部署、混合云数据面、SaaS 控制面与成本优化。新增网络架构、容灾设计、技术选型深度分析和平台功能详述。"
date: "2026-05-31"
updatedAt: "2026-05-31"
agent: "架构师"
tags: ["iot", "k8s", "multi-cloud", "saas", "terraform", "istio", "gitops"]
---

# 第3章：多云 K8s 集群与 SaaS 基础设施

## 3.1 多云战略选择

### 3.1.1 为什么必须是多云

| 维度 | 单云 | 多云 | 说明 |
|:-----|:----|:----|:------|
| 全球覆盖 | ❌ 部分区域延迟高 | ✅ 就近接入 | 亿级设备分布全球，单云无法覆盖所有区域 |
| 供应商锁定 | ⚠️ 高（数据/API 绑定） | ✅ 可迁移 | 避免单一厂商涨价或终止服务 |
| 合规 | ❌ 数据本地化困难 | ✅ 区域化存储 | GDPR（欧洲）/PIPL（中国）等法规要求数据不出境 |
| 容灾 | ⚠️ 单云故障影响大 | ✅ 跨云切换 | 云厂商宕机（如 AWS us-east-1 宕机）不影响核心功能 |
| 成本谈判 | ❌ 无竞争 | ✅ 竞价空间 | 每年 re-negotiate，可节省 15-30% |
| 服务多样性 | ⚠️ 受限于单云产品 | ✅ 最佳服务组合 | AWS S3 + GCP TPU + Azure Active Directory |

**真实案例**：
- 2021 年 12 月 AWS us-east-1 宕机 7 小时，Netflix/Disney+/Robinhood 全线下线
- 2023 年 6 月 GCP us-central1 宕机 3 小时，Spotify/Discord 受影响
- **教训**：亿级设备规模下，单云故障 = 全球服务中断 = 用户信任崩塌

### 3.1.2 三云分工

| 角色 | 主要职责 | 云服务 | 选择理由 |
|:-----|:---------|:-------|:---------|
| **AWS**（主数据面） | 设备接入、对象存储主湖、训练集群 | IoT Core + S3 + EKS + SageMaker | 生态最成熟、全球区域最多、企业客户最多 |
| **GCP**（副数据面 + AI） | 亚太区域接入、AI 训练、TPU 资源 | GKE + GCS + TPU + Vertex AI | TPU 训练性价比高、亚太网络质量好 |
| **Azure**（合规/备份） | 欧洲区域接入、合规存储、企业客户 | AKS + Blob Storage + IoT Hub | 欧洲市场占有率最高、企业 AD 集成最强 |

**数据流向**：
```
设备 → 最近云 IoT Gateway → 对象存储（本地）
                                │
                        异步复制（1-4h）
                                │
                                ▼
                    中心 S3 桶（全量数据聚合）
                                │
                                ▼
                    Iceberg Catalog（统一元数据）
```

### 3.1.3 云厂商选择评估框架

选择云厂商时，按以下维度打分（1-5 分）：

| 评估维度 | 权重 | AWS | GCP | Azure |
|:---------|:-----|:----|:----|:------|
| 全球区域覆盖 | 20% | 5（31 区域） | 4（41 区域但部分重叠） | 4（60+ 区域） |
| 物联网服务成熟度 | 25% | 5（IoT Core 最成熟） | 3（IoT Core 功能弱） | 4（IoT Hub 可用） |
| 对象存储成本 | 15% | 4（S3 标准 $0.023/GB） | 4（GCS $0.020/GB） | 3（Blob $0.025/GB） |
| K8s 托管质量 | 15% | 5（EKS 最稳定） | 5（GKE 最易用） | 4（AKS 稍慢） |
| AI/ML 服务 | 10% | 4（SageMaker） | 5（Vertex AI + TPU） | 3（Azure ML 弱） |
| 合规认证 | 10% | 5（最全） | 4（缺部分中国认证） | 5（最全） |
| **总分** | **100%** | **4.7** | **4.0** | **3.9** |

**结论**：AWS 作为主云（总分最高），GCP 作为 AI 训练专用云，Azure 作为欧洲合规云。

## 3.2 集群架构设计

### 3.2.1 全球集群拓扑

```
每个云厂商在每个区域部署 2 套集群（控制面 + 数据面）：

┌────────────── 区域（如 us-east-1）───────────────┐
│                                                  │
│  ┌──────────────┐     ┌──────────────┐          │
│  │  控制面集群    │     │  数据面集群   │          │
│  │  (SaaS 层)   │     │  (数据处理层) │          │
│  │              │     │              │          │
│  │ - 用户 API   │     │ - 设备数据    │          │
│  │ - OTA 下发   │     │   ETL Pipeline│          │
│  │ - 设备管理   │     │ - 模型推理    │          │
│  │ - A/B 测试   │     │   服务        │          │
│  │ - 数据标注   │     │ - 训练编排    │          │
│  │ - 计费管理   │     │ - 模型评估    │          │
│  │              │     │ - 数据质量监控 │         │
│  │  Node: 10-20 │     │              │          │
│  │  (高可用)    │     │  Node: 100-  │          │
│  │              │     │  500（弹性）  │          │
│  └──────────────┘     └──────────────┘          │
│                                                  │
│  网络：VPC Peering / Transit Gateway              │
│  存储：EBS → S3 / PD → GCS / Managed Disk →    │
└──────────────────────────────────────────────────┘
```

**全球集群数量**：3 云 × 8 区域 × 2 套 = **48 个 K8s 集群**

**区域选择依据**：
| 区域 | AWS | GCP | Azure | 覆盖设备 | 选择理由 |
|:-----|:----|:----|:-----|:---------|:---------|
| 北美东 | us-east-1 | us-central1 | eastus | 美国东部 | 用户密度最高 |
| 北美西 | us-west-2 | us-west1 | westus | 美国西部/亚太接入 | 距亚太近 |
| 欧洲西 | eu-west-1 | europe-west1 | westeurope | 欧盟 | 合规要求严 |
| 欧洲北 | eu-north-1 | europe-north1 | northeurope | 北欧/东欧 | 可再生能源便宜 |
| 亚太东南 | ap-southeast-1 | asia-southeast1 | southeastasia | 新加坡/印尼 | 东南亚用户多 |
| 亚太东北 | ap-northeast-1 | asia-northeast1 | japaneast | 日本/韩国 | 发达市场 |
| 中国 | cn-north-1 (北京) | - | - | 中国大陆 | ICP 牌照必需 |
| 南美 | sa-east-1 | southamerica-east1 | brazilsouth | 巴西/南美 | 拉美增长快 |

### 3.2.2 网络架构设计

#### VPC 规划

```
每个区域独立 VPC（避免 IP 冲突）：
┌──────────────────────────────────────────────────┐
│ VPC CIDR: 10.{region-id}.0.0/16              │
├──────────────┬───────────────┬───────────────┤
│ 公有子网      │ 私有子网        │ 数据子网       │
│ 10.x.1.0/24 │ 10.x.10.0/24  │ 10.x.20.0/24 │
│              │               │               │
│ - ALB       │ - K8s Node    │ - RDS         │
│ - NAT GW    │ - Pod         │ - ElastiCache  │
│ - Bastion   │ - Internal LB │ - MQ           │
└──────────────┴───────────────┴───────────────┘

路由表：
- 公有子网：IGW 路由（0.0.0.0/0 → igw-xxx）
- 私有子网：NAT GW 路由（0.0.0.0/0 → nat-xxx）
- 数据子网：本地路由（无 0.0.0.0/0）
```

**网络隔离策略**：
| 层级 | 子网类型 | 路由 | 安全组 | NACL |
|:-----|:-------|:-----|:-----|:-----|
| 入口层 | 公有子网 | IGW 路由 | ALB SG：允许 443/80 | 允许所有入站 |
| 应用层 | 私有子网 | NAT GW 路由 | K8s Node SG：仅允许来自 ALB | 拒绝 22/3389 |
| 数据层 | 数据子网 | 本地路由 | RDS SG：仅允许来自 K8s Node | 拒绝所有非本地 |

#### 混合云 Connectivity

```
设备 ─公网─→ IoT Gateway (云厂商托管)
                      │
                      ▼
              公有子网 (ALB / LB)
                      │
                 HTTPS/TLS 1.3
                      │
                      ▼
              私有子网 (K8s Pod)
                      │
                 VPC Peering
                      │
                      ▼
              数据子网 (RDS/Redis)
```

**为什么不用 VPN 连接设备？** 亿级设备建立 VPN 隧道不可行——IKE 协商开销太大（每个连接 2-5 秒），且设备 IP 不固定（NAT 后）。正确做法是：
1. 设备通过公网 MQTT/HTTPS 连接到云厂商托管的 IoT Gateway
2. IoT Gateway 做身份认证（X.509 证书）
3. Gateway 将消息路由到 K8s 服务（通过 Internal LB）

**跨云互联方案对比**：

| 方案 | 延迟 | 带宽 | 成本 | 适用场景 |
|:-----|:-----|:-----|:-----|:---------|
| AWS Direct Connect + GCP Cloud Interconnect | < 10ms | 10-100 Gbps | $1-2K/月 + 数据传输费 | 实时数据同步 |
| VPN (IPsec) | 50-100ms | 1.25 Gbps | $0.05/GB | 临时备份 |
| 公网 HTTPS | 100-200ms | 依赖互联网 | $0.08/GB | 异步复制 |

**推荐**：生产环境用 Direct Connect（主） + VPN（备）；非生产环境用公网 HTTPS。

### 3.2.3 托管 K8s vs 自建

| 维度 | 托管 K8s（EKS/GKE/AKS） | 自建 K8s（kubeadm/RAKS） |
|:-----|:----------------------|:--------|
| 控制面运维 | 云厂商负责（SLA 99.95%） | 需 5-10 人 SRE 团队 |
| 升级 | 自动（控制面）+ 托管升级节点 | 手动，需制定升级窗口 |
| 成本 | 控制面 $0.10/小时×集群 | 控制面节点 $30-50/月×3 |
| 扩展性 | 原生支持数万节点（云厂商优化） | 需额外工作（kubemark 压测） |
| 定制化 | 受限（不可修改 kube-apiserver 参数） | 完全可控 |
| 生态集成 | 原生集成云厂商服务（IRSA/Workload Identity） | 需自行对接（OIDC + Webhook） |
| 故障恢复 | 云厂商自动切换控制面节点 | 需手动干预（etcd 备份恢复） |

**结论**：亿级设备规模下，**托管 K8s 是唯一可行选择**。自建 48 个集群的控制面至少需要 50+ 人 SRE 团队，且单点故障风险高（etcd 脑裂、网络分区）。

### 3.2.4 容灾设计

#### 多可用区（AZ）部署

```
每个区域 3 个可用区（AZ）：
┌──────────────────────────────────────────────────┐
│ 区域：us-east-1                              │
├──────────────┬───────────────┬───────────────┤
│ AZ-1a        │ AZ-1b         │ AZ-1c         │
│ Node: 33     │ Node: 34      │ Node: 33      │
│ (1/3 容量)   │ (1/3 容量)    │ (1/3 容量)    │
└──────────────┴───────────────┴───────────────┘

K8s 调度策略：
- PodAntiAffinity：同一 Deployment 的 Pod 分散到 3 个 AZ
- Topology Spread Constraints：均匀分布在 AZ 间（maxSkew: 1）
- PodDisruptionBudget：至少 2/3 的 Pod 始终可用（minAvailable: 66%）
```

**AZ 故障演练**：
- 每月执行一次 AZ 故障注入（Chaos Mesh）
- 验证：Pod 重调度时间 < 2 分钟，服务中断 < 30 秒

#### 跨云灾备

```
主云（AWS us-east-1）→ 数据实时同步 → 备云（GCP us-central1）
                      │
                      ▼
              健康检查和自动切换
          (Route53/DNS Failover / Global Server Load Balancing)

RTO（恢复时间目标）：< 15 分钟
RPO（数据丢失目标）：< 5 分钟
```

**切换触发条件**：
1. **主云 AZ 故障** → K8s 自动重调度（< 2 分钟，自动）
2. **主云整个区域故障** → DNS 切换到备云区域（< 15 分钟，手动确认）
3. **主云全局故障** → 流量 100% 切换到备云（< 30 分钟，紧急预案）

**数据同步机制**：
```
AWS S3 ──S3 Cross-Region Replication──→ GCP GCS
         │                               │
         └── S3 Batch Replication ──────┘
            (通过 S3 Glacier 中转)
```

## 3.3 设备接入架构

### 3.3.1 IoT Gateway 选型

| 方案 | AWS IoT Core | GCP IoT Core | Azure IoT Hub | 自建 EMQX |
|:-----|:--------------|:--------------|:-------------|:---------|
| 协议支持 | MQTT/HTTPS/WebSocket | MQTT/HTTP | MQTT/AMQP/HTTPS | MQTT/WebSocket |
| 设备数上限 | 无限制 | 无限制 | 无限制 | 依赖集群规模 |
| 消息吞吐 | 1M msg/s/区域 | 500K msg/s/区域 | 500K msg/s/区域 | 可定制 |
| 设备管理 | 设备影子 + Jobs | 设备管理器 | 设备孪生 + 作业 | 需自建 |
| 成本 | $1.00/百万消息 | $0.60/百万消息 | $0.80/百万消息 | 人力成本 |
| OTA 支持 | ✅ 原生 | ✅ 原生 | ✅ 原生 | ❌ 需自建 |

**结论**：使用云厂商托管 IoT Gateway（AWS IoT Core 为主，GCP/Azure 为辅），避免自建消息 broker 的运维负担。

### 3.3.2 消息路由设计

```
设备消息流：
设备 → IoT Gateway (MQTT/TLS 1.3)
           │
           ├── $aws/rules/raw_data → S3 (原始数据存档)
           ├── $aws/rules/telemetry → Kinesis Data Streams → 实时分析
           ├── $aws/rules/alerts → SNS → Lambda → PagerDuty (告警)
           └── $aws/rules/ota_ack → IoT Jobs (OTA 确认)
```

**消息 Topic 设计**：
```
devices/{device_id}/data/{sensor_type}     # 传感器数据
devices/{device_id}/inference/result      # 端侧推理结果
devices/{device_id}/ota/status           # OTA 状态上报
devices/{device_id}/alerts               # 设备告警
```

### 3.3.3 设备影子与状态同步

**设备影子（Device Shadow）作用**：
- 设备离线时，云端仍可查询最后状态
- OTA 指令通过影子下发，设备上线后立即执行

```
设备影子 JSON 结构：
{
  "state": {
    "desired": {                    // 云端期望状态
      "ota_job_id": "job-20260531",
      "model_version": "v2.3.1"
    },
    "reported": {                  // 设备上报状态
      "firmware_version": "v2.3.0",
      "last_seen": "2026-05-31T10:15:00Z",
      "battery": 87
    },
    "metadata": { ... }           // 时间戳元数据
  }
}
```

## 3.4 多集群管理

### 3.4.1 工具链选型

| 工具 | 用途 | 替代方案 | 选择理由 |
|:-----|:-----|:--------|:---------|
| **Terraform + Crossplane** | 基础设施即代码（IaC） | Pulumi / AWS CDK / CloudFormation | Terraform 生态最成熟，Crossplane 补充 K8s 原生资源管理 |
| **Argo CD** | GitOps 多集群部署 | Flux CD / Jenkins X | Argo CD  UI 友好、支持多集群、Rollback 方便 |
| **Istio** | 服务网格、跨集群流量 | Linkerd / Consul Connect | Istio 功能最全（mTLS + 流量管理 + 策略），社区最大 |
| **Prometheus + Thanos** | 统一监控 | Grafana Mimir / Victoria Metrics | Thanos 支持长期存储（S3/GCS），查询性能优秀 |
| **Loki + Tempo** | 日志 + 链路追踪 | ELK Stack / Datadog | Loki 轻量（仅索引 metadata），成本远低于 ELK |

#### Terraform vs Pulumi 对比

| 维度 | Terraform | Pulumi |
|:-----|:----------|:--------|
| 语言 | HCL（专用 DSL） | TypeScript/Python/Go |
| 状态管理 | Terraform Cloud / S3 后端 | Pulumi Service / S3 后端 |
| 模块化 | Terraform Registry | NPM/PyPI |
| 学习曲线 | 中等（需学 HCL） | 低（用熟悉的语言） |
| 大厂采用 | ✅ 极高（80%+） | ⚠️ 中等（20%） |

**选择 Terraform**：生态成熟，招聘容易，模块库丰富（AWS/GCP/Azure 官方模块）。

#### Argo CD vs Flux CD 对比

| 维度 | Argo CD | Flux CD |
|:-----|:--------|:---------|
| UI | ✅ 自带 Web UI | ❌ 无 UI（需 3rd party） |
| 多集群 | ✅ 原生支持 | ⚠️ 需搭配 Weave GitOps |
| Rollback | ✅ 一键回滚 | ⚠️ 需手动 git revert |
| 权限控制 | ✅ RBAC 细粒度 | ⚠️ 基础 |
| 社区采用 | ✅ 更高 | ⚠️ 较低 |

**选择 Argo CD**：UI 友好便于运维，多集群管理原生支持。

### 3.4.2 GitOps 工作流

```
开发者 Push ──→ Git 仓库 (main 分支)
                    │
                    ▼
              Argo CD（控制面集群）
              - 检测变更（每 3 分钟 poll）
              - 自动同步（sync policy: automated）
                    │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
    EKS 集群    GKE 集群    AKS 集群
    (us-east-1) (asia-east1) (westeurope)
        │            │            │
        ▼            ▼            ▼
    Helm Release  Helm Release  Helm Release
    (iot-control)  (iot-control) (iot-control)
```

**Branching 策略**：
- `main`：生产环境（48 个集群）
- `staging`：预发布环境（3 个集群）
- `dev`：开发环境（1 个集群）

**Promotion 流程**：
```
dev 验证通过 → 创建 PR (dev → staging)
                    │
                    ▼
            Code Review + CI 测试
                    │
                    ▼
            Merge to staging → 自动部署到 staging
                    │
                    ▼
            Staging 验证 24h → 创建 PR (staging → main)
                    │
                    ▼
            再次 Review → Merge → 生产发布
```

### 3.4.3 Istio 服务网格设计

#### Ingress 网关

```
外部流量 → Istio Ingress Gateway (L7 Proxy)
                     │
            ┌────────┼────────┐
            ▼        ▼        ▼
       API Service  OTA Service  Label Service
       (Pod × 3)   (Pod × 5)   (Pod × 2)
```

**Gateway 配置示例**：
```yaml
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: iot-gateway
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 443
      name: https
      protocol: HTTPS
    tls:
      mode: SIMPLE
      credentialName: iot-tls-cert  # K8s Secret (ACM 证书)
    hosts:
    - "api.iot-platform.com"
```

#### 安全策略（PeerAuthentication）

```yaml
# 全局 mTLS（所有服务间通信强制加密）
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
spec:
  mtls:
    mode: STRICT  # 拒绝非 mTLS 流量
```

#### 流量管理（VirtualService）

```yaml
# A/B 测试流量分割（10% 到新版本）
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: ota-service
spec:
  hosts:
  - ota-service
  http:
  - match:
    - headers:
        x-ota-experiment:
          exact: "v2.3.1"
    route:
    - destination:
        host: ota-service
        subset: v2-3-1
  - route:
    - destination:
        host: ota-service
        subset: v2-2-0
      weight: 90
    - destination:
        host: ota-service
        subset: v2-3-1
      weight: 10
```

## 3.5 SaaS 控制面设计

### 3.5.1 多租户隔离

| 隔离级别 | 范围 | 实现方式 | 示例 |
|:---------|:-----|:---------|:---------|
| 数据隔离 | 租户数据不互通 | Iceberg 分区 + S3 前缀 + RLS | `device_id LIKE 'tenant_a_%'` |
| 计算隔离 | 训练任务不互相影响 | K8s Namespace + ResourceQuota + LimitRange | `namespace: tenant-a`, `quota: 100 GPU` |
| 网络隔离 | 租户流量不互通 | K8s NetworkPolicy + Istio AuthorizationPolicy | `policyTypes: [Ingress]`, `from: [namespace: tenant-a]` |
| 身份隔离 | 用户认证授权 | OIDC + RBAC + Custom Claims | `role: tenant_admin`, `tenants: [tenant_a]` |

#### ResourceQuota 示例

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: tenant-a-quota
  namespace: tenant-a
spec:
  hard:
    requests.cpu: "1000"        # 1000 核
    requests.memory: 4Ti         # 4 TB 内存
    nvidia.com/gpu: "64"        # 64 张 GPU
    persistentvolumeclaims: "100"
    services.loadbalancers: "5"
```

### 3.5.2 核心 API 设计

#### API 列表（RESTful）

| Method | Endpoint | 功能 | 请求示例 |
|:-------|:---------|:-----|:---------|
| POST | `/v1/devices/register` | 设备注册 | `{"device_id": "xxx", "model": "VLA-Device-v2"}` |
| POST | `/v1/devices/{id}/data` | 设备数据上报 | `{"timestamp": "...", "sensors": [...]}`, `Content-Type: multipart/form-data` |
| GET | `/v1/devices/{id}/config` | 设备配置拉取 | `?version=etag_abc123` (条件请求) |
| POST | `/v1/models/deploy` | 模型部署 | `{"model_id": "v2.3.1", "target": "canary_10pct"}` |
| GET | `/v1/models/{id}/status` | 模型状态查询 | Response: `{"status": "canary", "rollout_progress": 45}` |
| POST | `/v1/ota/create` | 创建 OTA 任务 | `{"firmware_url": "s3://...", "target_version": "v2.3.1"}` |
| GET | `/v1/ota/{id}/progress` | OTA 进度查询 | Response: `{"status": "in_progress", "devices_completed": 45000}` |
| POST | `/v1/data/export` | 导出训练数据 | `{"date_range": ["2026-05-01", "2026-05-31"], "format": "webdataset"}` |
| GET | `/v1/analytics/dashboard` | 分析看板 | Query: `?metrics=active_devices,data_volume` |

#### API 认证（OIDC + JWT）

```
1. 设备/用户 → POST /auth/token (client_id + client_secret)
2. Auth Service → 返回 JWT (有效期 1 小时)
   Header: {"alg": "RS256", "kid": "key-2026-05"}
   Payload: {"sub": "device:xxx", "scope": ["data:write", "config:read"], "exp": 1717166400}
   Signature: (RS256 签名)
3. 后续请求 → Authorization: Bearer <JWT>
4. API Gateway → 验证 JWT 签名 + 检查 scope
```

### 3.5.3 用户管理与认证

#### OIDC 集成（Auth0 / Cognito / Azure AD）

```
用户登录流程：
1. 用户访问 platform.iot.com → 重定向到 Auth0 (Universal Login)
2. 用户输入账号密码 / 使用 SSO (SAML/OIDC)
3. Auth0 验证 → 返回 Authorization Code
4. 平台后端用 Code 换取 ID Token + Access Token
5. 前端存储 Token (HttpOnly Cookie) → 后续请求带 Token
```

**角色定义（RBAC）**：
| 角色 | 权限 | 典型用户 |
|:-----|:-----|:---------|
| `super_admin` | 所有权限 | 平台运维团队 |
| `tenant_admin` | 租户内所有权限 | 企业客户 IT 管理员 |
| `data_scientist` | 读取数据 + 触发训练 | AI 团队 |
| `device_operator` | 注册设备 + OTA 操作 | 现场工程师 |
| `readonly_user` | 仅查询 | 高管 / 审计员 |

### 3.5.4 OTA 管理平台

#### OTA 全生命周期管理

```
1. 固件构建 (CI/CD)
   └── GitHub Actions → 编译 → 单元测试 → 签名 → 上传 S3

2. 创建 OTA 任务
   └── POST /v1/ota/create
       Request: {
         "firmware_version": "v2.3.1",
         "firmware_url": "s3://iot-firmware/v2.3.1.bin",
         "signature": "base64_encoded_signature",
         "target_group": "canary_10pct",  # 10% 设备
         "rollback_version": "v2.2.0"
       }

3. 设备拉取任务
   └── 设备轮询 GET /v1/devices/{id}/config
       Response: {"ota_job_id": "job_20260531", "firmware_url": "...", "signature": "..."}

4. 设备下载 + 验证签名 + 刷写
   └── 设备端：下载固件 → ECDSA 验签 → 刷写 → 重启 → 上报状态

5. 监控 + 自动回滚
   └── CloudWatch Alarm: OTA Failure Rate > 5%
       → Lambda: Stop OTA Job + Rollback to v2.2.0
```

#### OTA 灰度策略

| 阶段 | 目标设备 | 时长 | 监控指标 | 通过条件 |
|:-----|:-------|:-----|:---------|:---------|
| Canary 1% | 内部测试设备 | 24h | 崩溃率 < 0.1% | ✅ 无 P0 bug |
| Ring 10% | 自愿升级用户 | 48h | 任务成功率 > 95% | ✅ 无回归 |
| Ring 50% | 特定区域（如 us-east-1） | 72h | 用户投诉 < 10/天 | ✅ NPS > 0 |
| 全量 100% | 所有设备 | 24h（逐步扩量） | 系统稳定性 99.9% | ✅ 无异常 |

**回滚机制**：
- 端侧保留上一版本固件（双分区：A/B 分区）
- OTA 失败自动切换到上一版本
- 云端检测到失败率 > 5% → 自动停止 OTA + 通知运维

## 3.6 成本估算（多云 K8s 部分）

### 3.6.1 控制面成本

| 成本项 | 月成本（48 集群） | 年成本 | 备注 |
|:-------|:---------------|:-------|:-----|
| EKS/GKE/AKS 控制面 | $0.10/h × 24 × 30 × 48 = ~$3,456 | $41,472 | 托管 K8s 控制面费用 |
| Argo CD 控制面 | $0（开源） | $0 | 自托管在控制面集群 |
| Istio 控制面 | $0（开源） | $0 | Pilot + Citadel 自托管 |
| **控制面总计** | **~$3,500/月** | **~$42,000/年** | |

### 3.6.2 数据面成本（按需实例）

| 成本项 | 配置 | 月成本（单集群） | 48 集群/月 | 备注 |
|:-------|:-----|:---------------|:----------|:-----|
| 控制面节点 | 3× t3.medium (2C4G) | $60 | $2,880 | 仅运行 API/OTA 等轻量服务 |
| 数据面节点（按需） | 100× c5.2xlarge (8C16G) | ~$140,000 | $6,720,000 | 这是最大头！ |
| 数据面节点（Spot） | 100× c5.2xlarge Spot | ~$42,000 | $2,016,000 | 节省 70% |
| GPU 节点（训练/推理） | 1 万张卡，p4d/p5/pf 实例混合 | ~$45,000,000 | N/A（固定资源） | 训练 6K+推理 4K 分配 |

**优化策略**：
1. **Spot 实例**：数据面 70% 用 Spot（可中断），30% 保留按需（保证最低容量）
2. **自动扩缩容（CA / Karpenter）**：夜间缩容到 30%，白天扩容到 100%
3. **预留实例（RI）**：对稳定负载部分购买 1 年期 RI（节省 30-40%）

### 3.6.3 优化后成本（含 1 万张 GPU/NPU 卡）

| 优化项 | 月成本 | 年成本 |
|:-------|:-------|:-------|
| 控制面（不变） | $3,500 | $42,000 |
| 数据面（Spot 70% + RI 30%） | $1,200,000 | $14,400,000 |
| **GPU 训练/推理（1 万卡）** | **$45,000,000** | **$540,000,000** |
| 网络（跨 AZ 流量） | $50,000 | $600,000 |
| **总计** | **~$46.25M/月** | **~$555M/年** |

> **GPU 成本是最大头**：1 万张 A100 卡（按需 ~$4/卡/小时，Spot ~$1.2/卡/小时），按 70% 利用率估算，月成本约 $4,500 万。相比之下，K8s 控制面和数据面成本仅占 3%。

**对比自建**：
- 托管 K8s 年成本：~$20M
- 自建 K8s（50 人 SRE 团队）：~$15M（人力 $10M + 服务器 $5M）
- **但自建风险**：故障导致业务中断损失 >> $5M/年

## 3.7 本章小结

本章设计了多云 K8s 集群架构的完整方案：
- **多云平台**：AWS（主）+ GCP（AI 训练）+ Azure（合规），通过 Direct Connect 互联
- **集群拓扑**：3 云 × 8 区域 × 2 套 = 48 个 EKS/GKE/AKS 集群
- **网络架构**：VPC 三子网隔离（公有/私有/数据）+ NAT GW + VPN/Direct Connect
- **容灾设计**：多 AZ 部署（RTO < 2min）+ 跨云灾备（RTO < 15min）
- **设备管理**：IoT Gateway 接入 + 设备影子同步 + OTA 灰度发布
- **多集群管理**：Terraform (IaC) + Argo CD (GitOps) + Istio (Service Mesh)
- **SaaS 控制面**：多租户隔离 + OIDC 认证 + RBAC 权限 + OTA 全生命周期管理
- **算力资源**：1 万张 GPU/NPU 卡（训练 6K + 推理 4K），动态分配
- **成本**：云基础设施 ~$46.25M/月（~$555M/年），其中 GPU 成本占 97%

下一章讨论对象存储数据湖的设计——如何以最低成本存储和管理每天 450 PB 的物联网数据。
