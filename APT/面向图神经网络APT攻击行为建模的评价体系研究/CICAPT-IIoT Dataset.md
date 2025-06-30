| 列名                 | 含义                       | 示例值               |
| ------------------ | ------------------------ | ----------------- |
| `ts`               | 时间戳，表示该流开始的时间（Unix时间戳格式） | `1.701426e+09`    |
| `flow_duration`    | 流的持续时间（秒）                | `0.002112`        |
| `Header_Length`    | 报文头长度（字节）                | `132`             |
| `Source IP`        | 源IP地址                    | `172.16.64.128`   |
| `Destination IP`   | 目的IP地址                   | `172.16.66.128`   |
| `Source Port`      | 源端口号                     | `41750`           |
| `Destination Port` | 目的端口号                    | `502`（Modbus协议端口） |
| `Protocol Type`    | 协议类型编号（如6表示TCP）          | `6`               |
| `Protocol_name`    | 协议名称（如TCP、UDP）           | `TCP`             |
| `Duration`         | 持续时间（重复字段）               | `64`              |
| `Weight`           | 权重（某些协议或攻击场景自定义字段）       | `1, 4, 9...`      |
| `DS status`        | 差分服务状态字段（QoS相关）          | `0`               |
| `Fragments`        | 报文分片标志                   | `0`               |
| `Sequence number`  | 序列号                      | `0`               |
| `Protocol Version` | 协议版本号                    | `0`               |
