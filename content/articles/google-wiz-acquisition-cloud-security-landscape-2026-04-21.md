---
title: "Google $320 亿收购 Wiz：云安全格局重塑与三大巨头攻防战"
date: "2026-04-21"
tags: ["Google Cloud", "Wiz", "云安全", "CNAPP", "CrowdStrike", "并购", "GCP"]
summary: "Google 以 $320 亿完成对 Wiz 的收购，创云安全史上最大并购。本文分析 Wiz 的技术护城河、对 AWS/Azure 安全生态的冲击、以及 CrowdStrike/Palo Alto 的应对策略。"
category: "行业分析"
---

# Google $320 亿收购 Wiz：云安全格局重塑与三大巨头攻防战

## 背景

2026 年 4 月 21 日，Google 正式完成对以色列云安全公司 Wiz 的收购，交易金额 $320 亿（全现金），是 Google 历史上最大的收购，也是云安全领域有史以来最大的并购交易。

这笔交易的背景是：

- **Wiz 的火箭式增长**：2020 年成立，2024 年 ARR 突破 $5 亿，2025 年达 $10 亿，成为史上最快达到 $10 亿 ARR 的 SaaS 公司
- **GCP 安全短板**：在三大云厂商中，GCP 的原生安全能力一直被认为弱于 AWS（GuardDuty/Security Hub）和 Azure（Defender for Cloud）
- **AI 时代安全需求爆发**：AI 工作负载的安全需求（模型安全、数据隐私、Agent 权限管理）催生了新一轮云安全投资

## Wiz 的技术护城河

### 1. 无代理（Agentless）云安全扫描

Wiz 的核心技术创新是**无代理云安全扫描**——通过云 API 直接读取云环境的快照和配置，无需在每台虚拟机上安装 Agent：

```python
# Wiz 无代理扫描原理（简化伪代码）
class AgentlessScanner:
    def scan_cloud_environment(self, cloud_account):
        # 1. 通过云 API 获取所有资源清单
        resources = cloud_account.list_all_resources()

        # 2. 对每个计算实例，创建磁盘快照并挂载分析
        for vm in resources.get_vms():
            snapshot = cloud_account.create_disk_snapshot(vm)
            mounted = self.mount_snapshot_readonly(snapshot)

            # 3. 扫描文件系统（漏洞、密钥泄露、恶意软件）
            vulns = self.scan_vulnerabilities(mounted)
            secrets = self.scan_exposed_secrets(mounted)
            malware = self.scan_malware(mounted)

            # 4. 构建攻击路径图
            attack_paths = self.build_attack_graph(
                vm, vulns, secrets,
                network=resources.get_network_config(),
                iam=resources.get_iam_policies()
            )

            self.cleanup_snapshot(snapshot)

        # 5. 跨云统一风险评分
        return self.calculate_risk_score(all_findings)
```

### 2. Security Graph（安全知识图谱）

Wiz 的另一核心能力是**安全知识图谱**，将云环境中的所有实体（VM、容器、数据库、IAM 角色、网络配置）建模为图节点，攻击路径建模为图边：

| 维度 | Wiz Security Graph | CrowdStrike Falcon | Palo Alto Prisma |
|------|-------------------|-------------------|-----------------|
| 扫描方式 | 无代理 | Agent-based | 混合 |
| 覆盖范围 | 多云 + K8s + 无服务器 | 端点 + 云工作负载 | 多云 + 网络 |
| 攻击路径分析 | ✅ 图数据库驱动 | ⚠️ 有限 | ✅ 规则驱动 |
| 部署时间 | 分钟级 | 小时级 | 天级 |
| AI 集成 | Wiz AI（GPT-4 驱动） | Charlotte AI | Cortex XSIAM |
| ARR | $10B | $3.8B | $4.2B |

### 3. CNAPP 一体化平台

Wiz 的 CNAPP（Cloud-Native Application Protection Platform）覆盖云安全全生命周期：

- **CSPM**（云安全态势管理）：配置合规检查
- **CWPP**（云工作负载保护）：漏洞扫描、运行时保护
- **CIEM**（云基础设施权限管理）：IAM 过度授权检测
- **DSPM**（数据安全态势管理）：敏感数据发现和分类
- **代码安全**：IaC 扫描、CI/CD 管道安全

## 对云安全格局的冲击

### 三大云厂商安全能力对比（收购后）

| 能力 | GCP + Wiz | AWS | Azure |
|------|-----------|-----|-------|
| 原生 CNAPP | ✅ Wiz（行业第一） | ⚠️ GuardDuty + Inspector（分散） | ✅ Defender for Cloud |
| 攻击路径分析 | ✅ Security Graph | ❌ 无原生能力 | ⚠️ 基础版 |
| 无代理扫描 | ✅ 全覆盖 | ⚠️ 部分支持 | ⚠️ 部分支持 |
| AI 安全助手 | ✅ Wiz AI + Gemini | ✅ Amazon Q Security | ✅ Copilot for Security |
| 多云支持 | ✅ AWS/Azure/GCP | ❌ 仅 AWS | ⚠️ 有限多云 |

### 对独立安全厂商的冲击

1. **CrowdStrike**（股价 -5.2%）：Wiz 的无代理方案直接威胁 Falcon 的 Agent-based 模式，企业可能减少端点 Agent 部署
2. **Palo Alto Networks**（股价 -4.8%）：Prisma Cloud 与 Wiz 直接竞争，GCP 原生集成将让 Wiz 在 GCP 客户中占据绝对优势
3. **Zscaler/Okta**：间接影响，Wiz 的 CIEM 能力可能蚕食身份安全市场

### 对企业客户的影响

```python
# 企业云安全选型决策框架（收购后）
def recommend_security_stack(primary_cloud, multi_cloud, budget):
    if primary_cloud == "GCP":
        # GCP 客户：Wiz 成为默认选择
        return {
            "cnapp": "Wiz (GCP 原生集成)",
            "endpoint": "CrowdStrike Falcon",
            "network": "GCP Cloud Armor",
            "identity": "Google Cloud IAM + BeyondCorp"
        }
    elif primary_cloud == "AWS" and multi_cloud:
        # 多云客户：Wiz 仍有优势（多云统一视图）
        return {
            "cnapp": "Wiz (多云) 或 Palo Alto Prisma",
            "endpoint": "CrowdStrike Falcon",
            "network": "AWS WAF + Shield",
            "identity": "Okta + AWS IAM"
        }
    elif primary_cloud == "Azure":
        # Azure 客户：Defender for Cloud 是默认，Wiz 作为补充
        return {
            "cnapp": "Microsoft Defender for Cloud",
            "supplementary": "Wiz (攻击路径分析)",
            "endpoint": "Microsoft Defender for Endpoint",
            "identity": "Entra ID"
        }
```

## 中国市场启示

### 国内云安全格局

| 厂商 | 定位 | 核心产品 | 2025 营收 |
|------|------|---------|----------|
| 奇安信 | 综合安全 | AISOC + 天擎 | ¥82 亿 |
| 深信服 | 云安全 + SD-WAN | 云安全资源池 | ¥78 亿 |
| 360 | 安全大脑 | 安全大模型 | ¥45 亿 |
| 阿里云安全 | 云原生安全 | 云安全中心 | 未单独披露 |
| 腾讯安全 | 云原生安全 | 云防火墙 | 未单独披露 |

### 机会与挑战

1. **机会**：国内尚无 Wiz 级别的无代理 CNAPP 产品，存在创业空间
2. **挑战**：国内云安全市场以合规驱动为主（等保 2.0），技术驱动的 CNAPP 需求尚未爆发
3. **趋势**：随着 AI 工作负载增长，云安全从「合规检查」向「实时威胁检测」演进

## 总结

Google 收购 Wiz 是云计算行业的分水岭事件。它标志着：

1. **云安全从「附加功能」升级为「核心竞争力」**：三大云厂商将在安全能力上展开军备竞赛
2. **无代理扫描成为行业标准**：Agent-based 模式在云原生场景中的局限性日益明显
3. **安全知识图谱是下一代安全平台的核心**：从「告警列表」到「攻击路径图」的范式转变
4. **AI + 安全深度融合**：Wiz AI + Gemini 的组合将定义下一代智能安全运营

对于安全从业者，建议关注：
- GCP 客户应立即评估 Wiz 原生集成方案
- 多云客户需重新评估安全栈，考虑 Wiz 的多云统一视图优势
- 国内安全厂商应加速无代理 CNAPP 和安全图谱能力建设
