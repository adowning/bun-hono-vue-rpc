# Chinese to English Translation Dictionary

## Summary
- **Total Mapped Terms**: 200+ systematic translations
- **Categories**: Technical terms, JSDoc descriptions, comments, error messages
- **Consistency Rules**: Technical accuracy prioritized, context-specific variations handled
- **Exclusions**: User-facing strings, API contracts, file paths, technical acronyms, proper nouns

---

## Core Technical Terms

### Authentication & Authorization
| Chinese | English Translation | Context | Notes |
|---------|-------------------|---------|-------|
| 按钮权限 | Button Permissions | JSDoc/comment | Technical term for permission system |
| 权限标识 | Permission Identifier | JSDoc/comment | Technical API term |
| 是否有权限 | Has Permission | JSDoc/comment | Boolean return type |
| 权限列表 | Permission List | JSDoc/comment | Array type |
| 前端按钮权限 | Frontend Button Permissions | Comment | Client-side permission control |
| 后端路由权限 | Backend Route Permissions | Comment | Server-side permission control |
| 角色权限 | Role Permissions | Comment | RBAC system term |
| 菜单权限 | Menu Permissions | Comment | Navigation permission |
| 按钮权限 | Button Permissions | Comment | UI permission control |

### Data Management & APIs
| Chinese | English Translation | Context | Notes |
|---------|-------------------|---------|-------|
| 数据列表 | Data List | JSDoc/comment | Generic data structure |
| 表格数据 | Table Data | JSDoc/comment | Tabular data format |
| 搜索参数 | Search Parameters | JSDoc/comment | Query parameters |
| 分页配置 | Pagination Configuration | JSDoc/comment | Page size, current page settings |
| 缓存命中 | Cache Hit | Log/comment | Performance monitoring |
| 数据已缓存 | Data Cached | Log/comment | Cache status |
| 请求参数 | Request Parameters | JSDoc/comment | API input data |
| 响应数据 | Response Data | JSDoc/comment | API output data |
| 数据转换 | Data Transformation | JSDoc/comment | Data processing |
| 错误处理 | Error Handling | JSDoc/comment | Exception management |
| 获取数据失败 | Failed to Fetch Data | Error | API error message |
| 获取表格数据失败 | Failed to Fetch Table Data | Error | Specific table error |

### UI Components & Layout
| Chinese | English Translation | Context | Notes |
|---------|-------------------|---------|-------|
| 表格组件 | Table Component | Comment | Vue component |
| 表格头部 | Table Header | Comment | Table section |
| 表格大小 | Table Size | JSDoc/comment | Size enumeration |
| 加载状态 | Loading State | JSDoc/comment | UI state |
| 空状态 | Empty State | JSDoc/comment | No data state |
| 暂无数据 | No Data Available | String | User-facing but in code comments |
| 显示更多 | Show More | String | Button text (component internal) |
| 查看更多 | View More | String | Button text (component internal) |
| 返回顶部 | Back to Top | Comment | Button functionality |
| 全屏模式 | Fullscreen Mode | Comment | Display mode |
| 主题切换 | Theme Toggle | Comment | UI switcher |
| 语言切换 | Language Switch | Comment | i18n switcher |
| 设置面板 | Settings Panel | Comment | Configuration UI |
| 通知中心 | Notification Center | Comment | Alert system |
| 快速入口 | Quick Entry | Comment | Fast access feature |
| 面包屑 | Breadcrumb | Comment | Navigation path |
| 布局容器 | Layout Container | Comment | Container component |
| 系统logo | System Logo | Comment | Brand identifier |

### Chart & Visualization
| Chinese | English Translation | Context | Notes |
|---------|-------------------|---------|-------|
| 图表主题配置 | Chart Theme Configuration | Comment | ECharts styling |
| 字体大小 | Font Size | Comment | Typography setting |
| 字体颜色 | Font Color | Comment | Color setting |
| 主题颜色 | Theme Color | Comment | Brand color |
| 颜色组 | Color Group | Comment | Palette definition |
| 坐标轴线样式 | Axis Line Style | Comment | Chart axis styling |
| 分割线样式 | Split Line Style | Comment | Grid line styling |
| 坐标轴标签样式 | Axis Label Style | Comment | Label formatting |
| 坐标轴刻度样式 | Axis Tick Style | Comment | Tick formatting |
| 动画配置 | Animation Configuration | Comment | Chart animations |
| tooltip配置 | Tooltip Configuration | Comment | Hover information |
| 图例配置 | Legend Configuration | Comment | Chart legend |
| 图表初始化 | Chart Initialization | Comment | Setup process |
| 图表更新 | Chart Update | Comment | Data refresh |
| 图表销毁 | Chart Destruction | Comment | Cleanup process |
| 图表resize | Chart Resize | Comment | Size adjustment |
| 折线图 | Line Chart | Comment | Chart type |
| 柱状图 | Bar Chart | Comment | Chart type |
| 饼图 | Pie Chart | Comment | Chart type |
| 地图图表 | Map Chart | Comment | Geographic visualization |

### Event Handling & Lifecycle
| Chinese | English Translation | Context | Notes |
|---------|-------------------|---------|-------|
| 事件监听器 | Event Listener | Comment | Event handling |
| 生命周期钩子 | Lifecycle Hook | JSDoc/comment | Vue lifecycle |
| 组件挂载 | Component Mount | Comment | Initialization phase |
| 组件卸载 | Component Unmount | Comment | Cleanup phase |
| 监听数据变化 | Watch Data Changes | Comment | Reactive updates |
| 监听主题变化 | Watch Theme Changes | Comment | Theme updates |
| 防抖处理 | Debounce Handling | Comment | Performance optimization |
| 窗口resize | Window Resize | Comment | Browser event |
| IntersectionObserver | Intersection Observer | Comment | Visibility API |
| 请求动画帧 | Request Animation Frame | Comment | Performance API |

### Form & Validation
| Chinese | English Translation | Context | Notes |
|---------|-------------------|---------|-------|
| 表单验证 | Form Validation | Comment | Input checking |
| 验证规则 | Validation Rules | Comment | Rule definitions |
| 必填项 | Required Field | Comment | Form requirement |
| 输入框 | Input Field | Comment | Form element |
| 选择器 | Selector | Comment | Dropdown/select |
| 单选框 | Radio Button | Comment | Form control |
| 复选框 | Checkbox | Comment | Form control |
| 文件上传 | File Upload | Comment | File input |
| 富文本编辑器 | Rich Text Editor | Comment | Text editing |
| 占位符文本 | Placeholder Text | Comment | Input hint |

### System Configuration
| Chinese | English Translation | Context | Notes |
|---------|-------------------|---------|-------|
| 系统配置 | System Configuration | Comment | App settings |
| 功能配置 | Feature Configuration | Comment | Feature flags |
| 应用配置 | Application Configuration | Comment | App settings |
| 用户配置 | User Configuration | Comment | User preferences |
| 默认配置 | Default Configuration | Comment | Default values |
| 全局配置 | Global Configuration | Comment | App-wide settings |
| 主题配置 | Theme Configuration | Comment | Styling settings |
| 路由配置 | Route Configuration | Comment | Navigation setup |
| 模块配置 | Module Configuration | Comment | Feature module |

---

## JSDoc Parameter Descriptions

### Common Parameter Terms
| Chinese | English Translation | JSDoc Context | Type |
|---------|-------------------|---------------|------|
| 权限标识 | Permission Identifier | @param auth | string |
| 功能名称 | Feature Name | @param feature | string |
| 配置信息 | Configuration Info | @param config | object |
| 组件名称 | Component Name | @param componentName | string |
| 事件对象 | Event Object | @param evt | Event |
| 数据列表 | Data List | @param data | array |
| 搜索参数 | Search Parameters | @param params | object |
| 分页配置 | Pagination Config | @param pagination | object |
| 回调函数 | Callback Function | @param callback | function |
| 错误对象 | Error Object | @param error | Error |

### Return Type Descriptions
| Chinese | English Translation | JSDoc Context | Type |
|---------|-------------------|---------------|------|
| 是否有权限 | Has Permission | @returns | boolean |
| 是否启用 | Is Enabled | @returns | boolean |
| 是否显示 | Is Visible | @returns | boolean |
| 功能配置 | Feature Configuration | @returns | object |
| 启用的功能列表 | Enabled Features List | @returns | array |
| 禁用的功能列表 | Disabled Features List | @returns | array |

---

## Error Messages & Logging

### Common Error Patterns
| Chinese | English Translation | Context | Priority |
|---------|-------------------|---------|----------|
| 初始化失败 | Initialization Failed | Error | High |
| 加载失败 | Loading Failed | Error | High |
| 获取数据失败 | Failed to Fetch Data | Error | High |
| 更新失败 | Update Failed | Error | High |
| 删除失败 | Delete Failed | Error | High |
| 保存失败 | Save Failed | Error | High |
| 验证失败 | Validation Failed | Error | Medium |
| 权限不足 | Insufficient Permissions | Error | High |
| 网络错误 | Network Error | Error | High |
| 服务器错误 | Server Error | Error | High |

### Logging Messages
| Chinese | English Translation | Context | Level |
|---------|-------------------|---------|-------|
| 缓存命中 | Cache Hit | Log | Info |
| 数据已缓存 | Data Cached | Log | Info |
| 自动清理过期缓存 | Auto Cleanup Expired Cache | Log | Info |
| 监听表格头部高度失败 | Failed to Monitor Table Header Height | Warning | Warning |
| 图片加载失败 | Image Loading Failed | Error | Error |

---

## Configuration & Constants

### Time & Intervals
| Chinese | English Translation | Context | Unit |
|---------|-------------------|---------|------|
| 初始延迟时间 | Initial Delay Time | Comment | milliseconds |
| 间隔时间 | Interval Time | Comment | milliseconds |
| 延迟时间 | Delay Time | Comment | milliseconds |
| 缓存时间 | Cache Time | Comment | milliseconds |
| 超时时间 | Timeout Time | Comment | milliseconds |
| 每半个缓存周期 | Half Cache Period | Comment | time calculation |

### Size & Dimensions
| Chinese | English Translation | Context | Unit |
|---------|-------------------|---------|------|
| 容器宽度 | Container Width | JSDoc | pixels |
| 容器高度 | Container Height | JSDoc | pixels |
| 裁剪宽度 | Crop Width | JSDoc | pixels |
| 裁剪高度 | Crop Height | JSDoc | pixels |
| 字体大小 | Font Size | Comment | pixels |
| 最小宽度 | Minimum Width | Comment | pixels |
| 最大高度 | Maximum Height | Comment | pixels |

---

## Context-Specific Variations

### Same Term, Different Contexts
| Chinese | English Translation | Context Variation |
|---------|-------------------|------------------|
| 配置 | Configuration | System setup |
| 配置 | Settings | User preferences |
| 配置 | Options | UI elements |
| 管理 | Management | Admin functions |
| 管理 | Handle | Event processing |
| 管理 | Admin | System administration |
| 设置 | Settings | User configuration |
| 设置 | Setup | Initial configuration |
| 设置 | Configure | Action verb |
| 状态 | State | Vue reactive data |
| 状态 | Status | Current condition |
| 状态 | Mode | Display/operation mode |

### Technical vs. Business Context
| Chinese | English Translation | Technical Context | Business Context |
|---------|-------------------|-------------------|------------------|
| 用户 | User | User object/interface | End user |
| 角色 | Role | Role-based access control | Job position |
| 权限 | Permission | Technical permission | Business access |
| 菜单 | Menu | Navigation component | Application feature |
| 页面 | Page | Vue route/component | Business screen |
| 模块 | Module | Code organization | Business function |
| 功能 | Feature | Technical capability | Business function |
| 数据 | Data | Technical data structure | Business information |

---

## Proper Nouns (DO NOT TRANSLATE)

### Technical Acronyms
| Term | Reason for Non-Translation | Context |
|------|---------------------------|---------|
| Vue | Framework name | Framework name |
| TypeScript | Language name | Programming language |
| JavaScript | Language name | Programming language |
| API | Technical standard | Interface definition |
| URL | Technical standard | Web address |
| HTTP | Technical protocol | Network protocol |
| HTTPS | Technical protocol | Secure network protocol |
| JSON | Data format | Data interchange |
| XML | Data format | Data interchange |
| SQL | Database language | Query language |
| NoSQL | Database type | Database category |
| CRUD | Operation types | Database operations |
| REST | API architecture | Web service style |
| GraphQL | Query language | API query system |
| WebSocket | Protocol name | Real-time communication |
| WebRTC | Technology name | Peer-to-peer communication |

### Company & Brand Names
| Term | Reason for Non-Translation | Context |
|------|---------------------------|---------|
| Element Plus | UI library name | Vue component library |
| ECharts | Chart library name | Data visualization |
| WangEditor | Editor name | Rich text editor |
| 字节跳动 | Company name | BYTEDANCE |
| GitHub | Platform name | Code repository |
| npm | Package manager | Node.js ecosystem |
| Node.js | Runtime name | JavaScript runtime |

### File Paths & Technical References
| Term | Reason for Non-Translation | Context |
|------|---------------------------|---------|
| src/ | Directory path | Source code path |
| dist/ | Directory path | Build output path |
| node_modules/ | Directory path | Dependencies path |
| .env | Configuration file | Environment variables |
| .vue | File extension | Vue component file |
| .ts | File extension | TypeScript file |
| .js | File extension | JavaScript file |
| .json | File extension | JSON data file |

---

## Excluded Items (DO NOT TRANSLATE)

### User-Facing Strings (Per Requirements)
- Form input placeholders for actual user input
- Button text that appears in UI
- Success/error messages shown to users
- Validation messages for user input
- Any text in template literals for display

### API Contracts (Per Requirements)
- Variable names in API interfaces
- Property names in data contracts
- Enum values used in API requests
- Constant values for API communication

### File System References
- Import/export statement paths
- File path references
- Directory structure references
- Resource file paths

---

## Translation Quality Rules

### Consistency Requirements
1. **Same term, same translation** across all files
2. **Context-aware translations** for ambiguous terms
3. **Technical accuracy** over literal translation
4. **Code clarity** prioritized in technical contexts
5. **Maintain variable names** exactly as they are

### Style Guidelines
1. **Use technical English** for programming contexts
2. **Maintain code comments** structure and flow
3. **Preserve JSDoc formatting** and block structure
4. **Keep error message clarity** for debugging
5. **Use imperative mood** for action comments

### Case Sensitivity
- **Preserve original case** in technical terms
- **Use PascalCase** for React/Vue component names
- **Use camelCase** for JavaScript variables
- **Use UPPER_CASE** for constants
- **Use lowercase** for file extensions

---

## Special Considerations

### Vue.js Specific Terms
| Chinese | English Translation | Vue Context |
|---------|-------------------|-------------|
| 组合式函数 | Composables | Vue 3 Composition API |
| 响应式对象 | Reactive Object | Vue reactivity |
| 计算属性 | Computed Property | Vue computed |
| 监听器 | Watcher | Vue watch |
| 插槽 | Slot | Vue slots |
| 指令 | Directive | Vue directives |
| 修饰符 | Modifier | Vue modifiers |

### Database & Backend Terms
| Chinese | English Translation | Database Context |
|---------|-------------------|------------------|
| 数据库模式 | Database Schema | Schema definition |
| 迁移文件 | Migration File | DB version control |
| 种子数据 | Seed Data | Initial data |
| 关系数据库 | Relational Database | SQL database |
| 文档数据库 | Document Database | NoSQL database |
| 索引 | Index | Database optimization |
| 事务 | Transaction | ACID operations |

### Development Process Terms
| Chinese | English Translation | Dev Context |
|---------|-------------------|-------------|
| 构建工具 | Build Tool | Vite, Webpack |
| 包管理器 | Package Manager | npm, yarn |
| 代码质量 | Code Quality | ESLint, Prettier |
| 单元测试 | Unit Test | Test framework |
| 集成测试 | Integration Test | Test suite |
| 持续集成 | Continuous Integration | CI/CD pipeline |
| 版本控制 | Version Control | Git workflows |

---

**Last Updated**: Based on chinese-text-inventory.md analysis
**Coverage**: 5,936+ Chinese characters across 1,327+ occurrences
**Files Analyzed**: Composables, Components, Views directories