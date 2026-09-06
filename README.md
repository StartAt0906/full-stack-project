# E-commerce 电商全栈管理系统 (full-stack-project)

一个基于 **React 前端框架** 与 **Spring Boot 后端架构** 打造的现代电商全栈项目。本项目实现了完整的前后端分离，涵盖了商品浏览、购物车、订单处理及后台管理等核心电商业务场景。

## 🛠️ 技术栈架构

项目采用主流的前后端分离架构搭建，保证了系统的高性能与可扩展性：

| 模块 | 核心技术 | 说明 |
| :--- | :--- | :--- |
| **前端 (ecom-frontend)** | React / Vite / Hooks / Axios / Router | 响应式界面，极致的用户交互体验 |
| **后端 (sb-ecom)** | Spring Boot / Spring Security / Spring Data JPA / Maven | 健壮的企业级架构，轻量高效 |
| **数据库** | MySQL | 稳定的持久化数据存储与索引优化 |

---

## ✨ 核心功能亮点

### 🛍️ 用户前台商城
* **商品智能检索**：支持分类筛选、关键词搜索。
* **灵活购物车**：实现商品添加、数量动态调整、金额实时计算等纯前端交互。
* **安全结算与订单**：前后端统一校验，模拟完整的下单、创建订单流水。

### ⚙️ 后台管理系统
* **商品上架管理**：支持商品信息的增删改查（CRUD）与图片管理。
* **数据看板**：对订单状态、库存预警进行直观统计。

---

## 📂 项目目录结构说明

```text
full-stack-project
├── ecom-frontend/     # 前端 React 源代码
├── sb-ecom/           # 后端 Spring Boot 源代码
└── README.md          # 本项目说明文档
```

---

## 🚀 本地快速启动指南

### 1. 后端启动 (sb-ecom)
1. 导入项目根目录下的 `database.sql` 到你的 MySQL 数据库。
2. 用 IntelliJ IDEA 打开 `sb-ecom` 文件夹。
3. 修改 `application.properties` 中的数据库账号密码。
4. 运行 `SbEcomApplication.java` 启动后端（默认端口 `8080`）。

### 2. 前端启动 (ecom-frontend)
1. 用 VS Code 打开 `ecom-frontend` 文件夹。
2. 在终端运行 `npm install` 安装依赖包。
3. 运行 `npm run dev` 启动前端开发服务器。
4. 浏览器访问 `http://localhost:5173` 即可查看效果。
