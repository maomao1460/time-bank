# Time Bank - Supabase NAS 部署配置

## 目录结构

```
time-bank-deploy/
├── supabase/
│   ├── docker-compose.yml
│   └── .env
└── nginx/
    └── default.conf
```

## 使用方式

### 1. 在 NAS 上创建部署目录
```bash
mkdir -p /vol1/docker/time-bank/supabase
mkdir -p /vol1/docker/time-bank/nginx
```

### 2. 复制配置文件到对应目录

### 3. 生成密钥并填入 .env
```bash
openssl rand -hex 32  # 运行两次
```

### 4. 启动服务
```bash
cd /vol1/docker/time-bank
docker compose up -d
```

### 5. 访问地址
- 前端：http://NAS_IP
- Supabase API：http://NAS_IP:8000
- Supabase Studio：http://NAS_IP:3000
