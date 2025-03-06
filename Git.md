

## 本地 Git 仓库链接到 GitHub 上
---

### 1. 在 GitHub 上创建远程仓库

1\. 登录 [GitHub](https://github.com)。
2\. 点击右上角 `+` 号，选择 **"New repository"**（新建仓库）。
3\. 填写仓库名称（`your-repo-name`），可以选择 **Public（公开）** 或 **Private（私有）**。
4\. **不要勾选** "Initialize this repository with a README"（如果本地已经有文件）。
5\. 点击 **"Create repository"** 按钮，GitHub 会给你提供一个远程仓库地址，例如：
	   `https://github.com/your-username/your-repo.git`

### 2.在本地 Git 仓库添加远程地址

（确保本地文件夹已经是 Git 仓库，如果还不是，运行 `git init`）
```bash
git remote add origin https://github.com/your-username/your-repo.git
```
然后可以检查是否添加成功：
```bash
git remote -v
```
如果输出类似：
```perl
origin  https://github.com/your-username/your-repo.git (fetch)
origin  https://github.com/your-username/your-repo.git (push)
```
说明远程仓库已成功连接。

### 3.提交代码并推送到GitHub

1\. 添加所有文件到Git暂存区
```bash
   git add .
```

2\. 提交到本地仓库
```bash
git commit -m "Initial commit"
```

3\.推送代码到 GitHub（第一次推送需要指定分支名）
```bash
git push -u origin main
```
如果 `main` 分支不存在，可能需要用 `master` 代替：
```bash
git push -u origin master
```

### 4.(可选）如果 GitHub 仓库已有 `README.md` 或者 `.gitignore`

如果在 GitHub 上创建仓库时 **勾选了** "Initialize this repository with a README"，那么需要先拉取远程代码：
```bash
git pull origin main --allow-unrelated-histories
```
然后再执行 `git push` 进行同步。

### 5.（可选）设置默认分支为 `main`

如果 Git 默认分支不是 `main`，可以切换：
```bash
git branch -M main 
git push -u origin main
```


## 本地仓库修改后上传
***

### 1.查看本地仓库状态

```bash
git status
```
如果有文件被修改、删除或新增，Git 会列出它们。

### 2.添加修改到暂存区

将所有修改的文件添加到暂存区：
```bash
git add .
```
或者单独添加某个文件：
```bash
git add filename
```

### 3.提交更改

使用 `commit` 提交更改，并写上本次提交的描述：
```bash
git commit -m "更新了功能 X，修复了 bug Y"
```

### 4.推送到GitHub

将最新的更改推送到 GitHub：
```bash
git push origin master
```

### 5.（可选）拉取远程更新

如果和其他人协作，或者在 GitHub 直接修改了代码，在推送之前，先拉取最新代码：
```bash
git pull origin main
```
然后再执行 `git push` 以防止冲突。


## 克隆远程仓库到本地
***

已有一个远程Git仓库，可以直接克隆：
```bash
git clone https://github.com/your-username/your-repo.git
```
这样会在当前目录下创建一个 `your-repo` 文件夹，并自动初始化为 Git 仓库。



