package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"testing/quick"
)

// Feature: md-reader, Property 7: 文件类型识别正确性
// For any 文件路径，根据扩展名识别的文件类型应与预期一致
func TestGetFileType_Property(t *testing.T) {
	// 属性测试：Markdown 扩展名应返回 markdown 类型
	markdownExts := []string{".md", ".markdown", ".MD", ".MARKDOWN", ".Md"}
	for _, ext := range markdownExts {
		result := GetFileType("test" + ext)
		if result != FileTypeMarkdown {
			t.Errorf("Expected markdown for %s, got %s", ext, result)
		}
	}

	// 属性测试：Text 扩展名应返回 text 类型
	textExts := []string{".txt", ".TXT", ".Txt"}
	for _, ext := range textExts {
		result := GetFileType("test" + ext)
		if result != FileTypeText {
			t.Errorf("Expected text for %s, got %s", ext, result)
		}
	}

	// 属性测试：HTML 扩展名应返回 html 类型
	htmlExts := []string{".html", ".htm", ".HTML", ".HTM"}
	for _, ext := range htmlExts {
		result := GetFileType("test" + ext)
		if result != FileTypeHTML {
			t.Errorf("Expected html for %s, got %s", ext, result)
		}
	}

	// 属性测试：不支持的扩展名应返回 unsupported
	unsupportedExts := []string{".pdf", ".doc", ".jpg", ".png", ".exe", ""}
	for _, ext := range unsupportedExts {
		result := GetFileType("test" + ext)
		if result != FileTypeUnsupported {
			t.Errorf("Expected unsupported for %s, got %s", ext, result)
		}
	}
}

// 使用 testing/quick 进行属性测试
func TestGetFileType_QuickCheck(t *testing.T) {
	f := func(basename string) bool {
		if len(basename) == 0 || strings.ContainsAny(basename, "/\\") {
			return true
		}
		filename := basename + ".md"
		return GetFileType(filename) == FileTypeMarkdown
	}

	if err := quick.Check(f, &quick.Config{MaxCount: 100}); err != nil {
		t.Error(err)
	}
}

// 属性测试：IsSupportedFile 与 GetFileType 一致性
func TestIsSupportedFile_Consistency(t *testing.T) {
	f := func(filename string) bool {
		fileType := GetFileType(filename)
		isSupported := IsSupportedFile(filename)
		if fileType == FileTypeUnsupported {
			return !isSupported
		}
		return isSupported
	}

	if err := quick.Check(f, &quick.Config{MaxCount: 100}); err != nil {
		t.Error(err)
	}
}

// Feature: md-reader, Property 8: 不支持的格式返回错误
func TestReadFile_UnsupportedFormat(t *testing.T) {
	fs := NewFileService()
	unsupportedFiles := []string{"test.pdf", "test.doc", "test.jpg", "test.png", "test.exe", "test"}

	for _, filename := range unsupportedFiles {
		result := fs.ReadFile(filename)
		if result.Error == "" {
			t.Errorf("Expected error for unsupported file %s", filename)
		}
		if result.FileType != FileTypeUnsupported {
			t.Errorf("Expected unsupported type for %s, got %s", filename, result.FileType)
		}
	}
}

// 属性测试：不支持的格式总是返回错误
func TestReadFile_UnsupportedFormat_QuickCheck(t *testing.T) {
	fs := NewFileService()
	unsupportedExts := []string{".pdf", ".doc", ".jpg", ".png", ".exe", ".zip"}

	f := func(basename string) bool {
		if len(basename) == 0 || strings.ContainsAny(basename, "/\\:*?\"<>|") {
			return true
		}
		for _, ext := range unsupportedExts {
			result := fs.ReadFile(basename + ext)
			if result.Error == "" || result.FileType != FileTypeUnsupported {
				return false
			}
		}
		return true
	}

	if err := quick.Check(f, &quick.Config{MaxCount: 100}); err != nil {
		t.Error(err)
	}
}

// Feature: md-reader, Property 1: 文件树只包含支持的格式
func TestGetFileTree_OnlySupportedFormats(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "mdreader_test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tempDir)

	testFiles := []string{"readme.md", "notes.txt", "index.html", "image.png", "doc.pdf"}
	for _, filename := range testFiles {
		f, _ := os.Create(filepath.Join(tempDir, filename))
		f.Close()
	}

	subDir := filepath.Join(tempDir, "subdir")
	os.Mkdir(subDir, 0755)
	os.Create(filepath.Join(subDir, "nested.md"))
	os.Create(filepath.Join(subDir, "nested.exe"))

	fs := NewFileService()
	result := fs.GetFileTree(tempDir)

	if result.Error != "" {
		t.Fatalf("Unexpected error: %s", result.Error)
	}
	checkAllFilesSupported(t, result.Tree)
}

func checkAllFilesSupported(t *testing.T, node *TreeNode) {
	if node == nil {
		return
	}
	if !node.IsDir && !IsSupportedFile(node.Name) {
		t.Errorf("Found unsupported file: %s", node.Name)
	}
	for _, child := range node.Children {
		checkAllFilesSupported(t, child)
	}
}

func TestGetFileTree_FilteredCount(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "mdreader_test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tempDir)

	supportedCount := 0
	files := []string{"a.md", "b.txt", "c.html", "d.pdf", "e.jpg", "f.markdown"}
	for _, filename := range files {
		os.Create(filepath.Join(tempDir, filename))
		if IsSupportedFile(filename) {
			supportedCount++
		}
	}

	fs := NewFileService()
	result := fs.GetFileTree(tempDir)
	treeFileCount := countFiles(result.Tree)

	if treeFileCount != supportedCount {
		t.Errorf("Expected %d files, got %d", supportedCount, treeFileCount)
	}
}

func countFiles(node *TreeNode) int {
	if node == nil {
		return 0
	}
	count := 0
	if !node.IsDir {
		count = 1
	}
	for _, child := range node.Children {
		count += countFiles(child)
	}
	return count
}
