
## 背景
***

随着网络通信的加密普及（如HTTPS、VPN、Tor），传统基于明文内容的网络安全方法逐渐失效。
尽管内容被加密，网络流量的**元数据：流量模式、时序、数据包大小等等**仍然可被分析，成为安全研究的热点。

**异常检测**：旨在识别异常或可疑的活动和行为。

**基于签名的网络检测**：使用DPI技术进行流量分类和表征。

>[!note] DPI
>DPI是许多网络系统的核心组件，如流量监视器、分类器、数据包过滤器、网络入侵检测和防御系统。
>网络组件在OSI模型的不同层中使用DPI。DPI系统进行准确的流量监测和特征描述。
>DPI的使用可以通过识别不同风格的内容并相应地流式传输来提高服务质量（QoS）。

## 网络分析域
***

### 用途

#### 协议和应用程序分类

识别使用的应用。

#### 应用程序使用识别

判断用户使用应用的方式和频率。

Coull和Dyer：用于加密消息服务流量分析的方法。窃听者通过通信渠道获取细粒度信息，例如特定的用户行为、交换的消息大小，甚至是用于通信的语言。

Conti等：分析加密网络流量以识别Android设备上的用户行为，如电子邮件交换、社交网络交互等。框架利用了 TCP/IP 数据包字段（如 IP 地址和端口）以及其他特征（如数据包大小、方向和时间）。通过使用机器学习，他们在识别每个测试 Android 应用中不同用户操作（如邮件交换、在线发布照片或发布推文）方面实现了高准确率和精确度。

NetScope是一个针对 Android 和 iOS 设备，通过检查 IP 头信息进行用户活动稳健推断的研究成果。即使是在加密通信通道中，一个被动的窃听者也可以识别网络中由应用程序生成的细粒度用户活动。其核心思想是每个移动应用的实现方式会在其流量行为上留下“指纹”，例如传输速率和数据包交换模式。

Fu 等：对移动消息应用使用行为进行分类的方法，其系统名为 CUMMA，通过考虑用户行为模式、网络流量特征和时间依赖性来对移动消息应用的使用情况进行分类。通过观察数据包长度和时间延迟，可以对 WhatsApp 和微信的流量进行分类，并识别相应的使用类型（如照片分享）。

Liu 等：分析器用于将加密的移动流量分类为具体的应用使用活动。通过相似性度量，从流量数据包序列中选择具有判别性的特征。

OTTer是一个可扩展的引擎，可以在加密的网络流量连接中识别细粒度的用户操作，例如语音/视频通话或消息通信。

Wang 等：分析加密的网络流量，在交易阶段识别金融交易。从流量数据中识别出所使用的移动支付应用、分类在该支付应用中的具体操作，最终检测该操作中的详细步骤。

Jiang 等：远程桌面流量即使在加密的情况下，是否仍可能泄露使用信息。
#### 加密网络质量和经验调查

研究服务质量和用户体验。

### 算法和技术

采用机器学习技术来研究流量分析和使用分类的可行性，即使通信是加密的。

### 公开数据集



### 目标和局限性



## 网络安全域
***

### 用途

#### 网络入侵行为

检测网络入侵行为。

#### 手机上的恶意软件

检测手机上的恶意软件。

### 算法和技术

### 公开数据集

### 目标和局限性

## 用户隐私域
***

### 用途

#### PII泄漏检测

识别可能泄露个人身份信息的通信。

#### 设备/操作系统推测

通过流量分析推测用户使用的设备或操作系统。

#### 网页指纹

识别用户在匿名工具（如Tor）中访问的网页。

#### 位置估计

通过流量信息估计用户位置。

### 算法和技术

### 公开数据集

### 目标和局限性


## 中间盒网络功能域
***

### 用途

#### 网络功能

为网络功能（如流量整形、防火墙）提供支持。

### 算法和技术

### 公开数据集

### 目标和局限性

