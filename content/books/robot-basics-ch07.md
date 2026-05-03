---
title: "机器人入门——从材料到控制 - 第7章: 视觉感知与目标识别"
book: "机器人入门——从材料到控制"
chapter: "7"
chapterTitle: "视觉感知与目标识别"
description: "深度相机选型（RealSense/结构光/ToF）、手眼标定、OpenCV 目标检测、YOLOv8 实时识别、点云处理与 6D 位姿估计——让机器人真正看懂世界。"
date: "2026-05-02"
updatedAt: "2026-05-02 10:00"
agent: "研究员→编辑→审校员"
tags:
  - "机器人"
  - "视觉感知"
  - "深度相机"
  - "目标检测"
  - "手眼标定"
  - "点云"
type: "book"
---

# 第 7 章：视觉感知与目标识别

> **学习目标**：能完成相机标定和手眼标定；能用 YOLOv8 实时检测目标物体；能从深度图提取点云并估计 6D 位姿；会用视觉伺服实现末端精确对准。

---

## 7.1 相机选型：我应该用哪种相机？

机器人视觉场景的相机可分为三类：

| 类型 | 原理 | 代表产品 | 精度 | 速度 | 适用场景 |
|------|------|---------|------|------|---------|
| **RGB-D 结构光** | 投射红外散斑，三角法计算深度 | RealSense D435i | 1-3mm @1m | 30fps | 室内桌面抓取 |
| **ToF（飞行时间）** | 红外光往返时间 | Azure Kinect DK | 2-4mm @2m | 30fps | 人体姿态、中距离 |
| **双目立体视觉** | 视差三角测量 | ZED 2 / OAK-D | 3-5mm @1m | 30fps | 移动机器人、户外 |
| **工业相机+激光** | 激光三角 | Photoneo PhoXi | <0.1mm | 1fps | 高精度工业分拣 |
| **纯 RGB（单目）** | 仅颜色+形状 | 任意 USB 相机 | 无深度 | 120fps+ | 颜色检测、2D 场景 |

### 7.1.1 RealSense D435i 接入

```bash
# 安装 ROS 2 驱动
sudo apt install ros-humble-realsense2-camera

# 启动相机节点
ros2 launch realsense2_camera rs_launch.py \
    enable_color:=true \
    enable_depth:=true \
    align_depth.enable:=true \
    depth_module.profile:=640x480x30 \
    rgb_camera.profile:=640x480x30

# 查看话题
ros2 topic list | grep camera
# /camera/camera/color/image_raw        ← RGB 图像
# /camera/camera/depth/image_rect_raw   ← 深度图（单位 mm，uint16）
# /camera/camera/aligned_depth_to_color/image_raw  ← 对齐到 RGB 的深度图
# /camera/camera/color/camera_info      ← 内参（fx, fy, cx, cy）
# /camera/camera/depth/color/points     ← 点云（PointCloud2）
```

### 7.1.2 相机内参与畸变标定

```python
#!/usr/bin/env python3
"""
使用 OpenCV 标定相机内参
需要准备：棋盘格标定板（推荐 9×6 内角点，格子尺寸 30mm）
"""
import cv2
import numpy as np
import glob

# ─── 标定参数 ───
BOARD_W, BOARD_H = 9, 6   # 内角点数量
SQUARE_SIZE = 0.030        # 格子边长，单位 m

# 3D 世界坐标（Z=0 平面）
objp = np.zeros((BOARD_W * BOARD_H, 3), np.float32)
objp[:, :2] = np.mgrid[0:BOARD_W, 0:BOARD_H].T.reshape(-1, 2) * SQUARE_SIZE

obj_points, img_points = [], []   # 3D/2D 对应点

images = glob.glob('calib_images/*.jpg')
for fname in images:
    img = cv2.imread(fname)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    ret, corners = cv2.findChessboardCorners(gray, (BOARD_W, BOARD_H), None)
    if ret:
        # 亚像素级精化
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.001)
        corners = cv2.cornerSubPix(gray, corners, (11, 11), (-1, -1), criteria)
        obj_points.append(objp)
        img_points.append(corners)

h, w = gray.shape
ret, K, dist, rvecs, tvecs = cv2.calibrateCamera(
    obj_points, img_points, (w, h), None, None)

print(f"重投影误差: {ret:.4f} 像素（<0.5 为优秀）")
print(f"内参矩阵 K:\n{K.round(2)}")
print(f"畸变系数 dist: {dist.ravel().round(6)}")

# 保存标定结果
np.save('camera_K.npy', K)
np.save('camera_dist.npy', dist)

# 去畸变效果验证
img = cv2.imread(images[0])
undist = cv2.undistort(img, K, dist)
cv2.imwrite('undistorted.jpg', undist)
```

---

## 7.2 手眼标定（Eye-in-Hand / Eye-to-Hand）

手眼标定确定相机坐标系与机器人法兰坐标系之间的固定变换矩阵 **X**，是视觉抓取的前置条件。

```
Eye-in-Hand（相机装在末端法兰）：
  世界 → 基坐标 → 法兰 → 相机 → 标定板
  求解: X = T_flange_to_camera
  方程: AX = XB

Eye-to-Hand（相机固定于环境）：
  世界 → 相机 → 标定板
  求解: X = T_base_to_camera
  方程: AX = XB  (A/B 定义不同)
```

### 7.2.1 数据采集

```python
"""
手眼标定数据采集：
1. 在末端装上标定板（ArUco marker 或棋盘格）
2. 移动机器人到 15-20 个不同姿态
3. 每个姿态同时记录：末端位姿（FK）+ 相机检测到的标定板位姿
"""
import rclpy, cv2, numpy as np
from rclpy.node import Node
from geometry_msgs.msg import PoseStamped
from sensor_msgs.msg import Image
from cv_bridge import CvBridge

class EyeHandCollector(Node):
    def __init__(self):
        super().__init__('eye_hand_collector')
        self.bridge = CvBridge()
        self.K = np.load('camera_K.npy')
        self.dist = np.load('camera_dist.npy')

        # ArUco 检测器
        self.aruco_dict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_6X6_250)
        self.aruco_params = cv2.aruco.DetectorParameters()
        self.detector = cv2.aruco.ArucoDetector(self.aruco_dict, self.aruco_params)

        self.robot_poses = []   # 机器人末端位姿列表
        self.board_poses = []   # 标定板位姿列表
        self.current_flange_pose = None

        self.img_sub = self.create_subscription(
            Image, '/camera/color/image_raw', self.image_cb, 10)
        self.pose_sub = self.create_subscription(
            PoseStamped, '/robot/flange_pose', self.pose_cb, 10)

        self.create_timer(2.0, self.collect_sample)  # 每 2s 采集一次

    def pose_cb(self, msg):
        self.current_flange_pose = msg.pose

    def image_cb(self, msg):
        self.current_image = self.bridge.imgmsg_to_cv2(msg, 'bgr8')

    def collect_sample(self):
        if not hasattr(self, 'current_image') or self.current_flange_pose is None:
            return

        # 检测 ArUco marker
        corners, ids, _ = self.detector.detectMarkers(self.current_image)
        if ids is None or len(ids) == 0:
            return

        marker_size = 0.05  # ArUco marker 边长 5cm
        rvecs, tvecs, _ = cv2.aruco.estimatePoseSingleMarkers(
            corners, marker_size, self.K, self.dist)

        # 转换为 4×4 变换矩阵
        R_board, _ = cv2.Rodrigues(rvecs[0])
        T_cam_board = np.eye(4)
        T_cam_board[:3, :3] = R_board
        T_cam_board[:3,  3] = tvecs[0].ravel()

        # 机器人末端位姿转换为 4×4
        p = self.current_flange_pose
        q = [p.orientation.x, p.orientation.y, p.orientation.z, p.orientation.w]
        T_base_flange = pose_to_matrix([p.position.x, p.position.y, p.position.z], q)

        self.robot_poses.append(T_base_flange)
        self.board_poses.append(T_cam_board)
        self.get_logger().info(f'采集样本 #{len(self.robot_poses)}')

        if len(self.robot_poses) >= 20:
            self.solve_hand_eye()

    def solve_hand_eye(self):
        """使用 Tsai-Lenz 方法求解手眼标定"""
        R_gripper2base = [T[:3, :3] for T in self.robot_poses]
        t_gripper2base = [T[:3,  3] for T in self.robot_poses]
        R_target2cam   = [T[:3, :3] for T in self.board_poses]
        t_target2cam   = [T[:3,  3] for T in self.board_poses]

        R_cam2gripper, t_cam2gripper = cv2.calibrateHandEye(
            R_gripper2base, t_gripper2base,
            R_target2cam,   t_target2cam,
            method=cv2.CALIB_HAND_EYE_TSAI
        )

        T_cam2flange = np.eye(4)
        T_cam2flange[:3, :3] = R_cam2gripper
        T_cam2flange[:3,  3] = t_cam2gripper.ravel()
        np.save('T_cam2flange.npy', T_cam2flange)
        self.get_logger().info(f'手眼标定完成!\nT_cam2flange =\n{T_cam2flange.round(4)}')
```

---

## 7.3 目标检测：YOLOv8 实时识别

### 7.3.1 环境配置与模型训练

```bash
# 安装 Ultralytics
pip install ultralytics

# 数据集目录结构（YOLO 格式）
dataset/
├── images/
│   ├── train/   ← 训练图像
│   └── val/     ← 验证图像
├── labels/
│   ├── train/   ← 对应标注 .txt
│   └── val/
└── data.yaml    ← 数据集配置

# data.yaml 内容示例：
# path: ./dataset
# train: images/train
# val: images/val
# nc: 3                         # 类别数
# names: ['bottle', 'box', 'cup']

# 标注工具推荐：Roboflow（在线）或 LabelImg（本地）
# 标注格式：class_id  x_center  y_center  width  height（归一化 0-1）

# 训练（finetune YOLOv8n，最快）
yolo detect train \
    model=yolov8n.pt \
    data=dataset/data.yaml \
    epochs=100 \
    imgsz=640 \
    batch=16 \
    device=0 \
    project=runs/detect \
    name=robot_objects

# 评估指标：mAP50 > 0.85 为实用水平
```

### 7.3.2 ROS 2 中实时检测节点

```python
#!/usr/bin/env python3
"""
YOLOv8 ROS 2 检测节点
订阅 /camera/color/image_raw，发布检测结果
"""
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from vision_msgs.msg import Detection2DArray, Detection2D, BoundingBox2D
from cv_bridge import CvBridge
from ultralytics import YOLO
import numpy as np

class YoloDetectorNode(Node):
    def __init__(self):
        super().__init__('yolo_detector')

        # 参数
        self.declare_parameter('model_path', 'runs/detect/robot_objects/weights/best.pt')
        self.declare_parameter('confidence', 0.5)
        self.declare_parameter('device', 'cuda:0')

        model_path = self.get_parameter('model_path').value
        conf       = self.get_parameter('confidence').value
        device     = self.get_parameter('device').value

        self.model = YOLO(model_path)
        self.model.to(device)
        self.conf = conf
        self.bridge = CvBridge()

        self.img_sub = self.create_subscription(
            Image, '/camera/color/image_raw', self.image_cb, 10)
        self.det_pub = self.create_publisher(
            Detection2DArray, '/detections', 10)
        self.vis_pub = self.create_publisher(
            Image, '/detections/visualization', 10)

        self.get_logger().info(f'YOLOv8 节点启动，模型: {model_path}')

    def image_cb(self, msg: Image):
        img = self.bridge.imgmsg_to_cv2(msg, 'bgr8')
        results = self.model(img, conf=self.conf, verbose=False)[0]

        det_array = Detection2DArray()
        det_array.header = msg.header

        for box in results.boxes:
            det = Detection2D()
            det.header = msg.header

            # 边界框（像素坐标）
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            det.bbox.center.position.x = float((x1 + x2) / 2)
            det.bbox.center.position.y = float((y1 + y2) / 2)
            det.bbox.size_x = float(x2 - x1)
            det.bbox.size_y = float(y2 - y1)

            # 类别与置信度
            from vision_msgs.msg import ObjectHypothesisWithPose
            hyp = ObjectHypothesisWithPose()
            hyp.hypothesis.class_id = results.names[int(box.cls)]
            hyp.hypothesis.score = float(box.conf)
            det.results.append(hyp)
            det_array.detections.append(det)

        self.det_pub.publish(det_array)

        # 可视化
        vis_img = results.plot()
        vis_msg = self.bridge.cv2_to_imgmsg(vis_img, 'bgr8')
        vis_msg.header = msg.header
        self.vis_pub.publish(vis_msg)


def main():
    rclpy.init()
    node = YoloDetectorNode()
    rclpy.spin(node)
    rclpy.shutdown()
```

---

## 7.4 点云处理与物体位姿估计

### 7.4.1 深度图转点云

```python
import numpy as np
import open3d as o3d

def depth_to_pointcloud(depth_img, K, max_depth=2000):
    """
    深度图转换为点云
    depth_img: H×W uint16 图像，单位 mm
    K: 相机内参矩阵 [[fx,0,cx],[0,fy,cy],[0,0,1]]
    max_depth: 最大有效深度（mm）
    返回: (N, 3) numpy array，单位 mm
    """
    fx, fy = K[0, 0], K[1, 1]
    cx, cy = K[0, 2], K[1, 2]

    H, W = depth_img.shape
    u, v = np.meshgrid(np.arange(W), np.arange(H))

    z = depth_img.astype(np.float32)
    valid = (z > 0) & (z < max_depth)

    x = (u - cx) * z / fx
    y = (v - cy) * z / fy

    points = np.stack([x[valid], y[valid], z[valid]], axis=-1)
    return points

# Open3D 显示点云
def visualize_pointcloud(points_mm, colors=None):
    pcd = o3d.geometry.PointCloud()
    pcd.points = o3d.utility.Vector3dVector(points_mm / 1000.0)  # mm → m
    if colors is not None:
        pcd.colors = o3d.utility.Vector3dVector(colors.astype(np.float64) / 255.0)
    o3d.visualization.draw_geometries([pcd])
```

### 7.4.2 点云预处理流水线

```python
def preprocess_pointcloud(pcd_raw):
    """
    点云预处理：下采样 → 滤波 → 法向量估计
    """
    # 1. 体素下采样（减少点数，加速后续处理）
    voxel_size = 0.005  # 5mm 体素
    pcd_down = pcd_raw.voxel_down_sample(voxel_size)
    print(f"下采样: {len(pcd_raw.points)} → {len(pcd_down.points)} 点")

    # 2. 统计滤波（去除离群点）
    pcd_filtered, ind = pcd_down.remove_statistical_outlier(
        nb_neighbors=20,    # 参考邻居数
        std_ratio=2.0       # 超过 2σ 认为是噪声
    )
    print(f"离群点过滤后: {len(pcd_filtered.points)} 点")

    # 3. 估计法向量（用于 ICP 和 FPFH 特征）
    pcd_filtered.estimate_normals(
        search_param=o3d.geometry.KDTreeSearchParamHybrid(
            radius=0.03, max_nn=30)
    )
    # 法向量朝向相机
    pcd_filtered.orient_normals_towards_camera_location(
        camera_location=[0, 0, 0])

    return pcd_filtered

# 平面分割（去除桌面）
def remove_plane(pcd, distance_threshold=0.01):
    """
    RANSAC 平面分割，返回桌面以上的点云
    """
    plane_model, inliers = pcd.segment_plane(
        distance_threshold=distance_threshold,
        ransac_n=3,
        num_iterations=1000
    )
    [a, b, c, d] = plane_model
    print(f"桌面平面方程: {a:.3f}x + {b:.3f}y + {c:.3f}z + {d:.3f} = 0")

    # 保留桌面以上的点（非内点）
    pcd_objects = pcd.select_by_index(inliers, invert=True)
    return pcd_objects

# 欧式聚类（分割单个物体）
def cluster_objects(pcd, eps=0.02, min_points=100):
    """
    DBSCAN 聚类：识别桌面上的独立物体
    eps: 邻域半径 (m)
    min_points: 最小点数
    """
    labels = np.array(pcd.cluster_dbscan(eps=eps, min_points=min_points))
    max_label = labels.max()
    print(f"检测到 {max_label + 1} 个物体")

    clusters = []
    for i in range(max_label + 1):
        indices = np.where(labels == i)[0]
        cluster = pcd.select_by_index(indices)
        clusters.append(cluster)
    return clusters
```

### 7.4.3 6D 位姿估计（ICP 配准）

```python
def estimate_6d_pose(scene_pcd, model_pcd):
    """
    使用 FPFH + ICP 估计物体 6D 位姿
    scene_pcd: 场景点云（从深度图获取）
    model_pcd: 已知模型点云（CAD 导出）
    返回: 4×4 变换矩阵 T_model_to_scene
    """
    voxel_size = 0.005

    # 1. FPFH 特征提取（快速点特征直方图）
    def compute_fpfh(pcd, vs):
        pcd.estimate_normals(
            o3d.geometry.KDTreeSearchParamHybrid(radius=vs*2, max_nn=30))
        fpfh = o3d.pipelines.registration.compute_fpfh_feature(
            pcd,
            o3d.geometry.KDTreeSearchParamHybrid(radius=vs*5, max_nn=100))
        return fpfh

    fpfh_scene = compute_fpfh(scene_pcd, voxel_size)
    fpfh_model = compute_fpfh(model_pcd, voxel_size)

    # 2. 全局配准（RANSAC）
    result_global = o3d.pipelines.registration.registration_ransac_based_on_feature_matching(
        model_pcd, scene_pcd, fpfh_model, fpfh_scene,
        mutual_filter=True,
        max_correspondence_distance=voxel_size * 1.5,
        estimation_method=o3d.pipelines.registration.TransformationEstimationPointToPoint(False),
        ransac_n=4,
        checkers=[
            o3d.pipelines.registration.CorrespondenceCheckerBasedOnEdgeLength(0.9),
            o3d.pipelines.registration.CorrespondenceCheckerBasedOnDistance(voxel_size * 1.5)
        ],
        criteria=o3d.pipelines.registration.RANSACConvergenceCriteria(4000000, 500)
    )
    print(f"全局配准内点数: {len(result_global.correspondence_set)}")

    # 3. 精细配准（Point-to-Plane ICP）
    result_icp = o3d.pipelines.registration.registration_icp(
        model_pcd, scene_pcd,
        max_correspondence_distance=voxel_size * 0.4,
        init=result_global.transformation,
        estimation_method=o3d.pipelines.registration.TransformationEstimationPointToPlane(),
        criteria=o3d.pipelines.registration.ICPConvergenceCriteria(max_iteration=100)
    )
    print(f"ICP fitness: {result_icp.fitness:.4f}（>0.8 为良好配准）")
    print(f"ICP RMSE: {result_icp.inlier_rmse*1000:.2f} mm")

    return result_icp.transformation
```

---

## 7.5 从像素到机器人坐标：完整坐标变换链

```python
def pixel_to_robot_base(u, v, depth_mm, K, T_cam2flange, T_base2flange_current):
    """
    将图像中检测到的像素坐标 (u, v) + 深度值 → 机器人基坐标系 3D 坐标

    坐标变换链：
    像素(u,v,depth) → 相机坐标 → 法兰坐标 → 机器人基坐标
    """
    fx, fy = K[0, 0], K[1, 1]
    cx, cy = K[0, 2], K[1, 2]

    # 1. 像素 → 相机坐标（单位 mm）
    z_cam = float(depth_mm)
    x_cam = (u - cx) * z_cam / fx
    y_cam = (v - cy) * z_cam / fy
    p_cam = np.array([x_cam, y_cam, z_cam, 1.0])

    # 2. 相机坐标 → 法兰坐标
    T_cam2flange = np.load('T_cam2flange.npy')
    p_flange = T_cam2flange @ p_cam

    # 3. 法兰坐标 → 机器人基坐标（需要当前末端位姿）
    p_base = T_base2flange_current @ p_flange

    return p_base[:3]   # (x, y, z) in mm


class VisionGraspNode(Node):
    """完整视觉抓取流程：检测 → 定位 → 规划 → 执行"""

    def __init__(self):
        super().__init__('vision_grasp')
        self.K = np.load('camera_K.npy')
        self.T_cam2flange = np.load('T_cam2flange.npy')
        self.bridge = CvBridge()
        self.model = YOLO('best.pt')

        # 订阅
        self.rgb_sub = self.create_subscription(
            Image, '/camera/color/image_raw', self.rgb_cb, 10)
        self.depth_sub = self.create_subscription(
            Image, '/camera/aligned_depth_to_color/image_raw', self.depth_cb, 10)

        self.latest_rgb = None
        self.latest_depth = None

    def rgb_cb(self, msg): self.latest_rgb = self.bridge.imgmsg_to_cv2(msg, 'bgr8')
    def depth_cb(self, msg): self.latest_depth = self.bridge.imgmsg_to_cv2(msg, '16UC1')

    def detect_and_locate(self, target_class='bottle'):
        """检测目标并返回机器人基坐标系下的 3D 位置"""
        if self.latest_rgb is None or self.latest_depth is None:
            return None

        results = self.model(self.latest_rgb, verbose=False)[0]
        for box in results.boxes:
            cls_name = results.names[int(box.cls)]
            if cls_name != target_class:
                continue

            # 边界框中心像素
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
            cx = int((x1 + x2) / 2)
            cy = int((y1 + y2) / 2)

            # 从深度图取中心区域的中位深度（更鲁棒）
            roi_depth = self.latest_depth[
                max(0, cy-5):cy+5, max(0, cx-5):cx+5]
            valid = roi_depth[roi_depth > 0]
            if len(valid) == 0:
                continue
            depth_mm = float(np.median(valid))

            # 获取当前末端位姿
            T_base_flange = self.get_current_flange_pose()
            pos_base = pixel_to_robot_base(
                cx, cy, depth_mm, self.K,
                self.T_cam2flange, T_base_flange)

            self.get_logger().info(
                f"检测到 {target_class}: 深度={depth_mm:.0f}mm, "
                f"基坐标=({pos_base[0]:.1f}, {pos_base[1]:.1f}, {pos_base[2]:.1f})mm")
            return pos_base / 1000.0   # mm → m

        return None
```

---

## 7.6 视觉伺服（Visual Servo）

视觉伺服让机器人基于实时视觉反馈调整末端，实现亚毫米级精度对准。

```python
class ImageBasedVisualServo(Node):
    """
    IBVS（Image-Based Visual Servoing）
    控制目标：将目标特征点移动到图像中心
    """

    def __init__(self):
        super().__init__('ibvs_controller')
        self.K = np.load('camera_K.npy')
        self.Kp = 0.003   # 比例增益（调小可防止振荡）
        self.target_pixel = np.array([320.0, 240.0])  # 目标：图像中心
        self.dead_zone = 5.0  # 像素误差小于 5px 停止

        self.bridge = CvBridge()
        self.detector = YOLO('best.pt')

        self.img_sub = self.create_subscription(
            Image, '/camera/color/image_raw', self.control_loop, 10)
        self.vel_pub = self.create_publisher(
            TwistStamped, '/servo_node/delta_twist_cmds', 10)

    def control_loop(self, msg):
        img = self.bridge.imgmsg_to_cv2(msg, 'bgr8')
        results = self.detector(img, verbose=False)[0]

        if len(results.boxes) == 0:
            return  # 未检测到目标，停止

        # 取置信度最高的目标
        best_box = max(results.boxes, key=lambda b: float(b.conf))
        x1, y1, x2, y2 = best_box.xyxy[0].cpu().numpy()
        current_pixel = np.array([(x1+x2)/2, (y1+y2)/2])

        error = self.target_pixel - current_pixel
        pixel_error = np.linalg.norm(error)

        if pixel_error < self.dead_zone:
            self.get_logger().info(f'✓ 对准完成！误差 {pixel_error:.1f}px')
            return

        # 像素误差 → 相机坐标速度（IBVS 控制律）
        fx, fy = self.K[0, 0], self.K[1, 1]
        vx = self.Kp * error[0] / fx
        vy = self.Kp * error[1] / fy

        # 发布末端速度指令（用 MoveIt Servo）
        twist = TwistStamped()
        twist.header.stamp = self.get_clock().now().to_msg()
        twist.header.frame_id = 'camera_link'
        twist.twist.linear.x = float(vx)
        twist.twist.linear.y = float(vy)
        self.vel_pub.publish(twist)

        self.get_logger().info(
            f'IBVS: 像素误差 ({error[0]:.1f}, {error[1]:.1f})px → '
            f'速度 ({vx*1000:.2f}, {vy*1000:.2f}) mm/s')
```

---

## 7.7 本章小结

```
本章知识图谱：

  相机选型
  ├─ 结构光（RealSense）/ ToF / 双目 / 工业激光
  └─ 内参标定：棋盘格 + OpenCV calibrateCamera，重投影误差 < 0.5px

  手眼标定
  ├─ Eye-in-Hand vs Eye-to-Hand
  ├─ 数据采集：15-20 个不同姿态
  └─ Tsai-Lenz / OpenCV calibrateHandEye

  目标检测
  ├─ YOLOv8 训练：YOLO 格式数据集，mAP50 > 0.85
  └─ ROS 2 节点：订阅图像 → 检测 → 发布 Detection2DArray

  点云处理
  ├─ 深度图 → 点云（反投影）
  ├─ 预处理：体素下采样 + 统计滤波 + 法向量
  ├─ 桌面分割：RANSAC 平面
  ├─ 物体聚类：DBSCAN
  └─ 6D 位姿估计：FPFH + RANSAC + ICP

  坐标变换链
  └─ 像素 → 相机 → 法兰 → 机器人基坐标

  视觉伺服（IBVS）
  └─ 像素误差 → 末端速度指令 → 实时对准
```

---

## 思考题

1. 手眼标定时，为什么要求采集时的末端姿态变化要充分多样（不同位置 + 不同方向）？单纯平移而不改变姿态会导致什么问题？
2. 深度图的中心区域取中位深度（而非均值深度）用于定位，为什么这样更鲁棒？
3. YOLOv8 检测速度很快（30fps+），但 6D 位姿估计（ICP）往往只有 1-5fps，在实时抓取系统中如何协调两者的速率差异？
4. IBVS 中目标消失（物体被遮挡或移出视野）时控制器该如何处理？给出一个鲁棒的处理方案。
5. 反光材质（金属、玻璃）物体在深度图上会出现大量空洞，点云残缺不全，你有哪些工程上的应对方案？
