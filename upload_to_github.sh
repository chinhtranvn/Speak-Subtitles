#!/bin/bash
# ================================
# Script: upload_to_github.sh
# Chức năng: Upload một thư mục lên GitHub
# ================================

# 🔧 Cấu hình tùy chỉnh
GITHUB_USERNAME="chinhtranvn"        # Thay bằng username GitHub của bạn
REPO_NAME="Speak-Subtitles"                  # Tên repository trên GitHub
COMMIT_MSG="First commit - upload folder"  # Nội dung commit
BRANCH_NAME="1.0"                     # Nhánh mặc định (main hoặc master)
TARGET_DIR="."                         # Thư mục cần upload (mặc định là thư mục hiện tại)

# ================================
# 🚀 Thực thi
# ================================

# Di chuyển đến thư mục cần upload
cd "$TARGET_DIR" || exit

# Khởi tạo git nếu chưa có
if [ ! -d ".git" ]; then
  echo "🔧 Khởi tạo Git repo mới..."
  git init
fi

# Thêm remote (nếu chưa có)
if ! git remote | grep origin >/dev/null; then
  echo "🔗 Thêm remote origin..."
  git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
fi

# Thêm toàn bộ file
git add .

# Commit
git commit -m "$COMMIT_MSG"

# Đặt nhánh chính
git branch -M "$BRANCH_NAME"

# Push lên GitHub
git push -u origin "$BRANCH_NAME"

echo "✅ Upload hoàn tất! Repo: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
