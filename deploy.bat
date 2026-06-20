@echo off
echo ========================================
echo   Time Bank 部署脚本
echo ========================================
echo.

echo [1/3] 构建前端...
call npm run build
if %errorlevel% neq 0 (
    echo 构建失败！
    pause
    exit /b 1
)

echo.
echo [2/3] 复制 dist 到部署目录...
if not exist "deploy\frontend\dist" mkdir "deploy\frontend\dist"
xcopy /E /I /Y "dist\*" "deploy\frontend\dist\"

echo.
echo [3/3] 完成！
echo.
echo ========================================
echo   部署文件已准备就绪
echo ========================================
echo.
echo 接下来请：
echo 1. 将 deploy 文件夹复制到 NAS
echo 2. 在 NAS 上生成密钥：
echo    openssl rand -hex 32 （运行两次）
echo 3. 将密钥填入 deploy\.env 文件
echo 4. 运行：docker compose up -d
echo.
pause
