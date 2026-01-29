
## 文档结构
***

### 基本要素

```Latex
\documentclass[a4paper, 12pt]{article} 

\begin{document} 
	A sentence of text. 
\end{document}
```

`\documentclass` 命令必须出现在每个 LaTeX 文档的开头。花括号内的文本指定了文档的类型。**article** 文档类型适合较短的文章，比如期刊文章和短篇报告。其他文档类型包括 **report**（适用于更长的多章节的文档，比如博士生论文），**proc**（会议论文集），**book** 和 **beamer**。方括号内的文本指定了一些选项——示例中它设置纸张大小为 A4，主要文字大小为 12pt。

`\begin{document}` 和 `\end{document}` 命令将你的文本内容包裹起来。任何在 `\begin{documnet}` 之前的文本都被视为前导命令，会影响整个文档。任何在 `\end{document}` 之后的文本都会被忽视。

### 文档标题

`\maketitle` 命令可以给文档创建标题。需要指定文档的标题。如果没有指定日期，就会使用现在的时间，作者是可选的。

在 `\begin{document}` 和 命令后紧跟着输入以下文本：

```Latex
\title{My First Document} 
\author{My Name} 
\date{\today} 
\maketitle
```

文档现在长成这样：

```Latex
\documentclass[a4paper, 12pt]{article} 

\begin{document} 
	\title{My First Document} 
	\author{My Name} 
	\date{\today} 
	\maketitle 
	
	A sentence of text. 
\end{document}
```

>[!note]
>- `\today` 是插入当前时间的命令。也可以输入一个不同的时间，比如 `\date{November 2013}`。
>  - **article** 文档的正文会紧跟着标题之后在同一页上排版。**report** 会将标题置为单独的一页。

### 章节

将文档分为章（Chatpers）、节（Sections）和小节（Subsections）。

下列分节命令适用于 **article** 类型的文档：

- `\section{...}`
- `\subsection{...}`
- `\subsubsection{...}`
- `\paragraph{...}`
- `\subparagraph{...}`

花括号内的文本表示章节的标题。对于 **report** 和 **book** 类型的文档还支持 `\chapter{...}` 的命令。

将 "A sentence of text." 替换为以下文本：

```Latex
\section{Introduction} 
This is the introduction. 

\section{Methods} 

\subsection{Stage 1} 
The first part of the methods. 

\subsection{Stage 2} 
The second part of the methods. 

\section{Results} 
Here are my results.
```

文档变为：

```Latex
\documentclass[a4paper, 12pt]{article} 

\begin{document} 
	\title{My First Document} 
	\author{Lingxiang Tao} 
	\date{\today} 
	\maketitle 
	
	\section{Introduction} 
	This is the introduction. 
	
	\section{Methods} 
	
	\subsection{Stage 1} 
	The first part of the methods. 

	\subsection{Stage 2} 
	The second part of the methods. 
	
	\section{Results} 
	Here are my results. 
\end{document}
```

![[Pasted image 20250312121731.png]]

### 创建标签

可以对任意章节命令创建标签，这样他们可以在文档的其他部分被引用。使用 `\label{labelname}` 对章节创建标签。然后输入 `\ref{labelname}` 或者 `\pageref{labelname}` 来引用对应的章节。

在 `\subsection{Stage 1}` 下面另起一行，输入 `\label{sec1}`。
在 **Results** 章节输入 `Referring to section \ref{sec1} on page \pageref{sec1}`。

文档变为：

```latex
\documentclass[a4paper, 12pt]{article} 

\begin{document} 
	\title{My First Document} 
	\author{Lingxiang Tao} 
	\date{\today} 
	\maketitle 
	
	\section{Introduction} 
	This is the introduction. 
	
	\section{Methods} 
	
	\subsection{Stage 1} 
	\label{sec1}
	The first part of the methods. 

	\subsection{Stage 2} 
	The second part of the methods. 
	
	\section{Results} 
	Here are my results. Referring to section \ref{sec1} on page \pageref{sec1}
\end{document}
```

连续编译两次：

![[Pasted image 20250312170437.png]]

### 生成目录

使用分节命令，那么可以容易地生成一个目录。使用 `\tableofcontents` 在文档中创建目录。通常会在标题的后面建立目录。

更改页码为罗马数字（i,ii,iii）。这会确保文档的正文从第 1 页开始。页码可以使用 `\pagenumbering{...}` 在阿拉伯数字和罗马数字见切换。

在 `\maketitle` 之后输入以下内容：

```Latex
\pagenumbering{roman} 
\tableofcontents 
\newpage 
\pagenumbering{arabic}
```

`\newpage` 命令会另起一个页面。

文档变为：

```latex
\documentclass[a4paper, 12pt]{article} 

\begin{document} 
	\title{My First Document} 
	\author{Lingxiang Tao} 
	\date{\today} 
	\maketitle 
	
	\pagenumbering{roman} 
	\tableofcontents 
	\newpage 
	\pagenumbering{arabic}
	
	\section{Introduction} 
	This is the introduction. 
	
	\section{Methods} 
	
	\subsection{Stage 1} 
	\label{sec1}
	The first part of the methods. 

	\subsection{Stage 2} 
	The second part of the methods. 
	
	\section{Results} 
	Here are my results. Referring to section \ref{sec1} on page \pageref{sec1}
\end{document}
```

第一页：
![[Pasted image 20250312170736.png]]
第二页：
![[Pasted image 20250312170802.png]]

## 文字处理
***

### 中文字体支持

使用 `CTeX` 宏包。只需要在文档的前导命令部分添加：

```latex
\usepackage[UTF8]{ctex}
```

### 字体效果

LaTeX 有多种不同的字体效果

```latex
\textit{words in italics}  
  
\textsl{words slanted}  
  
\textsc{words in smallcaps}  

\textbf{wordsin bold}  
  
\texttt{words in teletype}  
  
\textsf{sans serif words}  
  
\textrm{roman words}  
  
\underline{underlined words}|
```

效果如下：

![[Pasted image 20250312171312.png]]

### 彩色字体

引用很多包来增强 LaTeX 的排版效果。包引用的命令放置在文档的前导命令的位置（即放在 `\begin{document}` 命令之前）。使用 `\usepackage[options]{package}` 来引用包。其中 **package** 是包的名称，而 **options** 是指定包的特征的一些参数。

使用 `\usepackage{color}` 后，可以调用常见的颜色。

使用彩色字体的代码为：

```latex
{\color{colorname}text}
```

其中 `colorname` 是你想要的颜色的名字，`text` 是你的彩色文本内容。

使用 Color 包中的 `\colorbox` 命令来达到文字背景色:

```latex
\colorbox{colorname}{text}
```

### 字体大小

```latex
normal size words {\tiny tiny words} {\scriptsize scriptsize words} {\footnotesize footnotesize words} {\small small words} {\large large words} {\Large Large words} {\LARGE LARGE words} {\huge huge words}
```

效果如下：
![[Pasted image 20250312172113.png]]

### 段落缩进

LaTeX 默认每个章节第一段首行顶格，之后的段落首行缩进。如果想要段落顶格，在要顶格的段落前加 `\noindent` 命令即可。如果希望全局所有段落都顶格，在文档的某一位置使用 `\setlength{\parindent}{0pt}` 命令，之后的所有段落都会顶格。

### 列表

LaTeX 支持两种类型的列表：有序列表（enumerate）和无序列表（itemize）。列表中的元素定义为 `\item`。列表可以有子列表。

```latex
\begin{enumerate} 
	\item First thing 
	
	\item Second thing 
		\begin{itemize} 
			\item A sub-thing 
			
			\item Another sub-thing 
		\end{itemize} 
	
	\item Third thing 
\end{enumerate}
```

列表长这样：
![[Pasted image 20250312172313.png]]

可以使用方括号参数来修改无序列表头的标志。例如，`\item[-]` 会使用一个杠作为标志，你甚至可以使用一个单词，比如 `\item[One]`。

```latex
\begin{itemize} 
	\item[-] First thing 
	
	\item[+] Second thing 
		\begin{itemize} 
			\item[Fish] A sub-thing 
			
			\item[Plants] Another sub-thing 
		\end{itemize} 
	
	\item[Q] Third thing 
\end{itemize}
```

生成效果：
![[Pasted image 20250312172559.png]]

### 注释和空格

使用 % 创建一个单行注释，在这个字符之后的该行上的内容都会被忽略，直到下一行开始。

```latex
It is a truth universally acknowledged% Note comic irony 
in the very first sentence , that a single man in possession of a good fortune, must be in want of a wife.
```

多个连续空格在 LaTeX 中被视为一个空格。多个连续空行被视为一个空行。空行的主要功能是开始一个新的段落。

通常来说，LaTeX 忽略空行和其他空白字符，两个反斜杠（`\\`）可以被用来换行。

想要在你的文档中添加空格，可以使用 `\vaspace{...}` 的命令。这样可以添加竖着的空格，高度可以指定。如 `\vspace{12pt}` 会产生一个空格，高度等于 12pt 的文字的高度。

### 特殊字符

下列字符在 LaTeX 中属于特殊字符：

`# $ % ^ & _ { } ~ \`

为了使用这些字符，需要在他们前面添加反斜杠进行转义：

`\# \$ \% \^{} \& \_ \{ \} \~{}`

注意在使用 `^` 和 `~` 字符的时侯需要在后面紧跟一对闭合的花括号，否则他们就会被解释为字母的上标，上面的代码生成的效果如下：

![[Pasted image 20250312195722.png]]

注意，反斜杠不能通过反斜杠转义（不然就变成了换行了），使用 `\textbackslash` 命令代替。

## 数学公式
***

**指数（上限）** `^`
**下标（下限）** `_`
**平方根** `\sqrt`  **n次方根** `\sqrt[n]`
**表达式的上、下方水平线** `\overline` , `\underline`
**表达式的上、下方水平大括号** `\overbrace` , `\underbrace`
**向量** `\vec` **从 A 到 B 的向量** `\overrightarrow` , `\overleftarrow`
**乘法算式中圆点符** `\cdot`
**分数** `\frac{分子}{分母}`$\frac{分子}{分母}$
**积分运算符** `\int` $\int$
**求和运算符** `\sum`$\sum$
**乘积运算符** `\prod`$\prod$
**偏导数** `\partial f`$\partial f$
## 数学符号表
***

![[数学模式重音符.png]]

![[小写希腊字母.png]]

![[大写希腊字母.png]]
![[二元关系符.png]]

![[二元运算符.png]]

![[大尺寸运算符.png]]

![[箭头.png]]

![[定界符.png]]

![[大尺寸定界符.png]]

![[其他符号.png]]