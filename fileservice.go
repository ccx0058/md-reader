package main

import (
	"context"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// FileType 文件类型常量
const (
	FileTypeMarkdown    = "markdown"
	FileTypeText        = "text"
	FileTypeHTML        = "html"
	FileTypeUnsupported = "unsupported"
)

// 支持的文件扩展名
var supportedExtensions = map[string]string{
	".md":       FileTypeMarkdown,
	".markdown": FileTypeMarkdown,
	".txt":      FileTypeText,
	".html":     FileTypeHTML,
	".htm":      FileTypeHTML,
}

// FileResult 文件读取结果
type FileResult struct {
	Path     string `json:"path"`
	Name     string `json:"name"`
	Content  string `json:"content"`
	FileType string `json:"fileType"`
	Error    string `json:"error,omitempty"`
}

// TreeNode 文件树节点
type TreeNode struct {
	ID       string      `json:"id"`
	Name     string      `json:"name"`
	Path     string      `json:"path"`
	IsDir    bool        `json:"isDir"`
	Children []*TreeNode `json:"children,omitempty"`
}

// FileService 文件服务
type FileService struct {
	ctx             context.Context
	settingsService *SettingsService
}

// NewFileService 创建文件服务实例
func NewFileService() *FileService {
	return &FileService{}
}

// SetContext 设置上下文
func (f *FileService) SetContext(ctx context.Context) {
	f.ctx = ctx
}

// SetSettingsService 设置设置服务（用于更新最近文件）
func (f *FileService) SetSettingsService(s *SettingsService) {
	f.settingsService = s
}

// GetFileType 根据文件扩展名获取文件类型
func GetFileType(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	if fileType, ok := supportedExtensions[ext]; ok {
		return fileType
	}
	return FileTypeUnsupported
}

// IsSupportedFile 检查文件是否为支持的格式
func IsSupportedFile(filename string) bool {
	return GetFileType(filename) != FileTypeUnsupported
}

// ReadFile 读取文件内容
func (f *FileService) ReadFile(path string) *FileResult {
	// 检查文件类型
	fileType := GetFileType(path)
	if fileType == FileTypeUnsupported {
		return &FileResult{
			Path:     path,
			Name:     filepath.Base(path),
			FileType: fileType,
			Error:    "不支持的文件格式，仅支持 .md、.markdown、.txt、.html、.htm",
		}
	}

	// 读取文件内容
	content, err := os.ReadFile(path)
	if err != nil {
		errMsg := "读取文件失败"
		if os.IsNotExist(err) {
			errMsg = "文件不存在"
		} else if os.IsPermission(err) {
			errMsg = "没有读取权限"
		}
		return &FileResult{
			Path:     path,
			Name:     filepath.Base(path),
			FileType: fileType,
			Error:    errMsg,
		}
	}

	return &FileResult{
		Path:     path,
		Name:     filepath.Base(path),
		Content:  string(content),
		FileType: fileType,
	}
}

// OpenFile 打开文件选择对话框
func (f *FileService) OpenFile() *FileResult {
	selection, err := runtime.OpenFileDialog(f.ctx, runtime.OpenDialogOptions{
		Title: "选择文件",
		Filters: []runtime.FileFilter{
			{DisplayName: "Markdown 文件", Pattern: "*.md;*.markdown"},
			{DisplayName: "文本文件", Pattern: "*.txt"},
			{DisplayName: "HTML 文件", Pattern: "*.html;*.htm"},
			{DisplayName: "所有支持的文件", Pattern: "*.md;*.markdown;*.txt;*.html;*.htm"},
		},
	})
	if err != nil {
		return &FileResult{Error: "打开对话框失败"}
	}
	if selection == "" {
		return &FileResult{Error: "未选择文件"}
	}

	// 添加到最近文件
	if f.settingsService != nil {
		_ = f.settingsService.AddRecentFile(selection)
	}

	return f.ReadFile(selection)
}

// FolderResult 文件夹打开结果
type FolderResult struct {
	Path  string    `json:"path"`
	Tree  *TreeNode `json:"tree"`
	Error string    `json:"error,omitempty"`
}

// GetFileTree 获取文件夹的文件树结构
func (f *FileService) GetFileTree(rootPath string) *FolderResult {
	info, err := os.Stat(rootPath)
	if err != nil {
		return &FolderResult{Path: rootPath, Error: "无法访问文件夹"}
	}
	if !info.IsDir() {
		return &FolderResult{Path: rootPath, Error: "不是文件夹"}
	}

	tree := buildTreeNode(rootPath, info.Name())
	return &FolderResult{
		Path: rootPath,
		Tree: tree,
	}
}

// buildTreeNode 递归构建文件树节点
func buildTreeNode(path string, name string) *TreeNode {
	node := &TreeNode{
		ID:   path,
		Name: name,
		Path: path,
	}

	info, err := os.Stat(path)
	if err != nil {
		return node
	}

	node.IsDir = info.IsDir()

	if info.IsDir() {
		entries, err := os.ReadDir(path)
		if err != nil {
			return node
		}

		var dirs []*TreeNode
		var files []*TreeNode

		for _, entry := range entries {
			// 跳过隐藏文件和文件夹
			if strings.HasPrefix(entry.Name(), ".") {
				continue
			}

			childPath := filepath.Join(path, entry.Name())

			if entry.IsDir() {
				// 递归处理子文件夹
				childNode := buildTreeNode(childPath, entry.Name())
				// 只添加包含支持文件的文件夹
				if len(childNode.Children) > 0 || hasSuportedFiles(childPath) {
					dirs = append(dirs, childNode)
				}
			} else if IsSupportedFile(entry.Name()) {
				// 只添加支持的文件
				files = append(files, &TreeNode{
					ID:    childPath,
					Name:  entry.Name(),
					Path:  childPath,
					IsDir: false,
				})
			}
		}

		// 文件夹和文件分别排序（文件夹优先）
		sort.Slice(dirs, func(i, j int) bool {
			return strings.ToLower(dirs[i].Name) < strings.ToLower(dirs[j].Name)
		})
		sort.Slice(files, func(i, j int) bool {
			return strings.ToLower(files[i].Name) < strings.ToLower(files[j].Name)
		})

		// 先添加文件夹，再添加文件
		for _, dir := range dirs {
			node.Children = append(node.Children, dir)
		}
		for _, file := range files {
			node.Children = append(node.Children, file)
		}
	}

	return node
}

// hasSuportedFiles 检查文件夹是否包含支持的文件
func hasSuportedFiles(dirPath string) bool {
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return false
	}

	for _, entry := range entries {
		if !entry.IsDir() && IsSupportedFile(entry.Name()) {
			return true
		}
		if entry.IsDir() && !strings.HasPrefix(entry.Name(), ".") {
			childPath := filepath.Join(dirPath, entry.Name())
			if hasSuportedFiles(childPath) {
				return true
			}
		}
	}
	return false
}

// OpenFolder 打开文件夹选择对话框
func (f *FileService) OpenFolder() *FolderResult {
	selection, err := runtime.OpenDirectoryDialog(f.ctx, runtime.OpenDialogOptions{
		Title: "选择文件夹",
	})
	if err != nil {
		return &FolderResult{Error: "打开对话框失败"}
	}
	if selection == "" {
		return &FolderResult{Error: "未选择文件夹"}
	}

	return f.GetFileTree(selection)
}
