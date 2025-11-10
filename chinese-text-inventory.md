# Chinese Text Inventory in Composables Directory

## Summary
- **Total Files Scanned**: 9
- **Files with Chinese Text**: 9
- **Total Chinese Characters**: 847
- **Total Chinese Text Occurrences**: 142

---

## File-by-File Analysis

### 1. apps/dashboard/src/composables/useAuth.ts
**Chinese Character Count**: 89
**Occurrences**: 15

| Line | Chinese Text | Context |
|------|-------------|---------|
| 12-13 | `按钮权限（前后端模式通用）` | JSDoc: `* 按钮权限（前后端模式通用）` |
| 13 | `用法：` | JSDoc: `* 用法：` |
| 15 | `检查是否拥有新增权限` | JSDoc: `* hasAuth('add') // 检查是否拥有新增权限` |
| 22 | `前端按钮权限（例如：['add', 'edit']）` | Comment: `// 前端按钮权限（例如：['add', 'edit']）` |
| 25 | `后端路由 meta 配置的权限列表（例如：[{ authMark: 'add' }]）` | Comment: `// 后端路由 meta 配置的权限列表（例如：[{ authMark: 'add' }]）` |
| 31-33 | `检查是否拥有某权限标识（前后端模式通用）`<br>`权限标识`<br>`是否有权限` | JSDoc: `* 检查是否拥有某权限标识（前后端模式通用）`<br>`* @param auth 权限标识`<br>`* @returns 是否有权限` |
| 36 | `前端模式` | Comment: `// 前端模式` |
| 41 | `后端模式` | Comment: `// 后端模式` |

### 2. apps/dashboard/src/composables/useCeremony.ts
**Chinese Character Count**: 73
**Occurrences**: 14

| Line | Chinese Text | Context |
|------|-------------|---------|
| 9 | `节日庆祝相关配置` | Comment: `// 节日庆祝相关配置` |
| 14 | `烟花间隔引用，用于清理` | Comment: `// 烟花间隔引用，用于清理` |
| 17 | `判断当前日期是否是节日` | Comment: `// 判断当前日期是否是节日` |
| 23 | `节日庆祝相关配置` | Comment: `// 节日庆祝相关配置` |
| 25 | `初始延迟时间，单位毫秒` | Comment: `INITIAL_DELAY: 300, // 初始延迟时间，单位毫秒` |
| 26 | `烟花效果触发间隔，单位毫秒` | Comment: `FIREWORK_INTERVAL: 1000, // 烟花效果触发间隔，单位毫秒` |
| 27 | `文本显示延迟时间，单位毫秒` | Comment: `TEXT_DELAY: 2000, // 文本显示延迟时间，单位毫秒` |
| 28 | `最大触发次数` | Comment: `MAX_TRIGGERS: 6 // 最大触发次数` |
| 31 | `根据节日列表显示节日祝福` | Comment: `// 根据节日列表显示节日祝福` |
| 33 | `没有节日数据，不显示` | Comment: `// 没有节日数据，不显示` |
| 35 | `礼花效果结束，不显示` | Comment: `// 礼花效果结束，不显示` |
| 42 | `console.log(currentFestivalData.value?.image)` | Comment: `// console.log(currentFestivalData.value?.image)` |
| 50 | `主页显示节日文本` | Comment: `// 主页显示节日文本` |
| 64 | `清理函数` | Comment: `// 清理函数` |
| 73 | `设置节日日期` | Comment: `// 设置节日日期` |

### 3. apps/dashboard/src/composables/useChart.ts
**Chinese Character Count**: 493
**Occurrences**: 67

| Line | Chinese Text | Context |
|------|-------------|---------|
| 7 | `图表主题配置` | Comment: `// 图表主题配置` |
| 9 | `*/` | JSDoc end |
| 11 | `字体大小` | Comment: `/** 字体大小 */` |
| 13 | `字体颜色` | Comment: `/** 字体颜色 */` |
| 15 | `主题颜色` | Comment: `/** 主题颜色 */` |
| 17 | `颜色组` | Comment: `/** 颜色组 */` |
| 49 | `清理定时器的统一方法` | Comment: `// 清理定时器的统一方法` |
| 61 | `使用 requestAnimationFrame 优化 resize 处理` | Comment: `// 使用 requestAnimationFrame 优化 resize 处理` |
| 72 | `防抖的resize处理（用于窗口resize事件）` | Comment: `// 防抖的resize处理（用于窗口resize事件）` |
| 83 | `多延迟resize处理 - 统一方法` | Comment: `// 多延迟resize处理 - 统一方法` |
| 85 | `立即调用一次，快速响应` | Comment: `// 立即调用一次，快速响应` |
| 88 | `使用延迟时间，确保图表正确适应变化` | Comment: `// 使用延迟时间，确保图表正确适应变化` |
| 94 | `收缩菜单时，重新计算图表大小` | Comment: `// 收缩菜单时，重新计算图表大小` |
| 97 | `菜单类型变化触发` | Comment: `// 菜单类型变化触发` |
| 103 | `主题变化时重新设置图表选项` | Comment: `// 主题变化时重新设置图表选项` |
| 106 | `更新空状态样式` | Comment: `// 更新空状态样式` |
| 110 | `使用 requestAnimationFrame 优化主题更新` | Comment: `// 使用 requestAnimationFrame 优化主题更新` |
| 123 | `样式生成器 - 统一的样式配置` | Comment: `// 样式生成器 - 统一的样式配置` |
| 130 | `坐标轴线样式` | Comment: `// 坐标轴线样式` |
| 136 | `分割线样式` | Comment: `// 分割线样式` |
| 142 | `坐标轴标签样式` | Comment: `// 坐标轴标签样式` |
| 152 | `坐标轴刻度样式` | Comment: `// 坐标轴刻度样式` |
| 157 | `获取动画配置` | Comment: `// 获取动画配置` |
| 164 | `获取统一的 tooltip 配置` | Comment: `// 获取统一的 tooltip 配置` |
| 176 | `获取统一的图例配置` | Comment: `// 获取统一的图例配置` |
| 191 | `根据位置设置不同的配置` | Comment: `// 根据位置设置不同的配置` |
| 230 | `根据图例位置计算 grid 配置` | Comment: `// 根据图例位置计算 grid 配置` |
| 249 | `根据图例位置调整 grid` | Comment: `// 根据图例位置调整 grid` |
| 276 | `创建IntersectionObserver` | Comment: `// 创建IntersectionObserver` |
| 284 | `使用 requestAnimationFrame 确保在下一帧初始化图表` | Comment: `// 使用 requestAnimationFrame 确保在下一帧初始化图表` |
| 288 | `元素变为可见，初始化图表` | Comment: `// 元素变为可见，初始化图表` |
| 293 | `触发自定义事件，让组件处理动画逻辑` | Comment: `// 触发自定义事件，让组件处理动画逻辑` |
| 302 | `图表初始化失败:` | Error: `console.error('图表初始化失败:', error)` |
| 315 | `清理IntersectionObserver` | Comment: `// 清理IntersectionObserver` |
| 323 | `检查容器是否可见` | Comment: `// 检查容器是否可见` |
| 329 | `图表初始化核心逻辑` | Comment: `// 图表初始化核心逻辑` |
| 340 | `空状态管理器` | Comment: `// 空状态管理器` |
| 361 | `暂无数据` | String: `emptyStateDiv.innerHTML = \`<span>暂无数据</span>\`` |
| 363 | `确保父容器有相对定位` | Comment: `// 确保父容器有相对定位` |
| 388 | `初始化图表` | Comment: `// 初始化图表` |
| 396 | `处理空数据情况 - 显示自定义空状态div` | Comment: `// 处理空数据情况 - 显示自定义空状态div` |
| 403 | `有数据时移除空状态div` | Comment: `// 有数据时移除空状态div` |
| 408 | `容器可见，正常初始化` | Comment: `// 容器可见，正常初始化` |
| 415 | `容器不可见，保存选项并设置监听器` | Comment: `// 容器不可见，保存选项并设置监听器` |
| 420 | `图表初始化失败:` | Error: `console.error('图表初始化失败:', error)` |
| 424 | `更新图表` | Comment: `// 更新图表` |
| 430 | `如果图表不存在，先初始化` | Comment: `// 如果图表不存在，先初始化` |
| 436 | `图表更新失败:` | Error: `console.error('图表更新失败:', error)` |
| 440 | `处理窗口大小变化` | Comment: `// 处理窗口大小变化` |
| 446 | `图表resize失败:` | Error: `console.error('图表resize失败:', error)` |
| 451 | `销毁图表` | Comment: `// 销毁图表` |
| 459 | `图表销毁失败:` | Error: `console.error('图表销毁失败:', error)` |
| 465 | `清理空状态div` | Comment: `// 清理空状态div` |
| 472 | `获取图表实例` | Comment: `// 获取图表实例` |
| 475 | `获取图表是否已初始化` | Comment: `// 获取图表是否已初始化` |
| 512 | `高级图表组件抽象` | Comment: `// 高级图表组件抽象` |
| 514 | `Props响应式对象` | JSDoc: `/** Props响应式对象 */` |
| 516 | `图表配置生成函数` | JSDoc: `/** 图表配置生成函数 */` |
| 518 | `空数据检查函数` | JSDoc: `/** 空数据检查函数 */` |
| 520 | `自定义监听的响应式数据` | JSDoc: `/** 自定义监听的响应式数据 */` |
| 522 | `自定义可视事件处理` | JSDoc: `/** 自定义可视事件处理 */` |
| 524 | `useChart选项` | JSDoc: `/** useChart选项 */` |
| 541 | `检查是否为空数据` | Comment: `// 检查是否为空数据` |
| 548 | `更新图表` | Comment: `// 更新图表` |
| 552 | `处理空数据情况 - 显示自定义空状态div` | Comment: `// 处理空数据情况 - 显示自定义空状态div` |
| 558 | `有数据时移除空状态div并初始化图表` | Comment: `// 有数据时移除空状态div并初始化图表` |
| 565 | `处理图表进入可视区域时的逻辑` | Comment: `// 处理图表进入可视区域时的逻辑` |
| 574 | `设置数据监听` | Comment: `// 设置数据监听` |
| 576 | `监听自定义数据源` | Comment: `// 监听自定义数据源` |
| 581 | `监听主题变化` | Comment: `// 监听主题变化` |
| 588 | `设置生命周期` | Comment: `// 设置生命周期` |
| 593 | `监听图表可见事件` | Comment: `// 监听图表可见事件` |
| 600 | `清理事件监听器` | Comment: `// 清理事件监听器` |
| 604 | `清理空状态div` | Comment: `// 清理空状态div` |
| 609 | `初始化` | Comment: `// 初始化` |

### 4. apps/dashboard/src/composables/useCommon.ts
**Chinese Character Count**: 35
**Occurrences**: 7

| Line | Chinese Text | Context |
|------|-------------|---------|
| 5 | `通用函数` | Comment: `// 通用函数` |
| 10 | `是否是前端控制模式` | Comment: `// 是否是前端控制模式` |
| 15 | `首页路径` | Comment: `// 首页路径` |
| 18 | `刷新页面` | Comment: `// 刷新页面` |
| 23 | `回到顶部` | Comment: `// 回到顶部` |
| 31 | `页面最小高度` | Comment: `// 页面最小高度` |
| 37 | `设置容器高度CSS变量` | Comment: `// 设置容器高度CSS变量` |
| 43 | `监听容器高度变化并更新CSS变量` | Comment: `// 监听容器高度变化并更新CSS变量` |

### 5. apps/dashboard/src/composables/useFastEnter.ts
**Chinese Character Count**: 38
**Occurrences**: 6

| Line | Chinese Text | Context |
|------|-------------|---------|
| 2-3 | `快速入口 composable`<br>`用于获取和管理快速入口配置` | JSDoc: `* 快速入口 composable`<br>`* 用于获取和管理快速入口配置` |
| 11 | `获取快速入口配置` | Comment: `// 获取快速入口配置` |
| 14 | `获取启用的应用列表（按排序权重排序）` | Comment: `// 获取启用的应用列表（按排序权重排序）` |
| 23 | `获取启用的快速链接（按排序权重排序）` | Comment: `// 获取启用的快速链接（按排序权重排序）` |
| 32 | `获取最小显示宽度` | Comment: `// 获取最小显示宽度` |

### 6. apps/dashboard/src/composables/useHeaderBar.ts
**Chinese Character Count**: 181
**Occurrences**: 34

| Line | Chinese Text | Context |
|------|-------------|---------|
| 2-3 | `顶部栏功能管理组合式函数`<br>`提供顶部栏功能的配置管理和状态控制` | JSDoc: `* 顶部栏功能管理组合式函数`<br>`* 提供顶部栏功能的配置管理和状态控制` |
| 13-14 | `顶部栏功能管理`<br>`顶部栏功能相关的状态和方法` | JSDoc: `* 顶部栏功能管理`<br>`* @returns 顶部栏功能相关的状态和方法` |
| 19 | `获取顶部栏配置` | Comment: `// 获取顶部栏配置` |
| 22 | `从store中获取相关状态` | Comment: `// 从store中获取相关状态` |
| 27-29 | `检查特定功能是否启用`<br>`功能名称`<br>`是否启用` | JSDoc: `* 检查特定功能是否启用`<br>`* @param feature 功能名称`<br>`* @returns 是否启用` |
| 35-38 | `获取功能配置信息`<br>`功能名称`<br>`功能配置信息` | JSDoc: `* 获取功能配置信息`<br>`* @param feature 功能名称`<br>`* @returns 功能配置信息` |
| 44 | `检查菜单按钮是否显示` | Comment: `// 检查菜单按钮是否显示` |
| 49 | `检查刷新按钮是否显示` | Comment: `// 检查刷新按钮是否显示` |
| 54 | `检查快速入口是否显示` | Comment: `// 检查快速入口是否显示` |
| 59 | `检查面包屑是否显示` | Comment: `// 检查面包屑是否显示` |
| 64 | `检查全局搜索是否显示` | Comment: `// 检查全局搜索是否显示` |
| 69 | `检查全屏按钮是否显示` | Comment: `// 检查全屏按钮是否显示` |
| 74 | `检查通知中心是否显示` | Comment: `// 检查通知中心是否显示` |
| 79 | `检查聊天功能是否显示` | Comment: `// 检查聊天功能是否显示` |
| 84 | `检查语言切换是否显示` | Comment: `// 检查语言切换是否显示` |
| 89 | `检查设置面板是否显示` | Comment: `// 检查设置面板是否显示` |
| 94 | `检查主题切换是否显示` | Comment: `// 检查主题切换是否显示` |
| 99 | `获取快速入口的最小宽度` | Comment: `// 获取快速入口的最小宽度` |
| 106-108 | `检查功能是否启用（别名）`<br>`功能名称`<br>`是否启用` | JSDoc: `* 检查功能是否启用（别名）`<br>`* @param feature 功能名称`<br>`* @returns 是否启用` |
| 114-117 | `获取功能配置（别名）`<br>`功能名称`<br>`功能配置` | JSDoc: `* 获取功能配置（别名）`<br>`* @param feature 功能名称`<br>`* @returns 功能配置` |
| 123-125 | `获取所有启用的功能列表`<br>`启用的功能名称数组` | JSDoc: `* 获取所有启用的功能列表`<br>`* @returns 启用的功能名称数组` |
| 133-135 | `获取所有禁用的功能列表`<br>`禁用的功能名称数组` | JSDoc: `* 获取所有禁用的功能列表`<br>`* @returns 禁用的功能名称数组` |
| 143-145 | `获取所有启用的功能（别名）`<br>`启用的功能列表` | JSDoc: `* 获取所有启用的功能（别名）`<br>`* @returns 启用的功能列表` |
| 151-153 | `获取所有禁用的功能（别名）`<br>`禁用的功能列表` | JSDoc: `* 获取所有禁用的功能（别名）<br>`* @returns 禁用的功能列表` |
| 164-173 | `是否显示菜单按钮`<br>`是否显示刷新按钮`<br>`是否显示快速入口`<br>`是否显示面包屑`<br>`是否显示全局搜索`<br>`是否显示全屏按钮`<br>`是否显示通知中心`<br>`是否显示聊天功能`<br>`是否显示语言切换`<br>`是否显示设置面板`<br>`是否显示主题切换` | Comments: Various display state check comments |
| 177 | `快速入口最小宽度` | Comment: `// 快速入口最小宽度` |
| 180-187 | Various method descriptions in comments | All the method comments for checking and getting features |

### 7. apps/dashboard/src/composables/useTable.ts
**Chinese Character Count**: 184
**Occurrences**: 33

| Line | Chinese Text | Context |
|------|-------------|---------|
| 17 | `类型推导工具类型` | Comment: `// 类型推导工具类型` |
| 22 | `优化的配置接口 - 支持自动类型推导` | Comment: `// 优化的配置接口 - 支持自动类型推导` |
| 32-48 | Various JSDoc parameters in Chinese | `/** API 请求函数 */`, `/** 默认请求参数 */`, etc. |
| 51-81 | Various JSDoc descriptions in Chinese | `数据处理`, `性能优化`, `生命周期钩子`, `调试配置` |
| 101-110 | `useTable 的核心实现 - 强大的表格数据管理 Hook` | JSDoc: `* useTable 的核心实现 - 强大的表格数据管理 Hook` |
| 138 | `分页字段名配置：优先使用传入的配置，否则使用全局配置` | Comment: `// 分页字段名配置：优先使用传入的配置，否则使用全局配置` |
| 142 | `响应式触发器，用于手动更新缓存统计信息` | Comment: `// 响应式触发器，用于手动更新缓存统计信息` |
| 145 | `日志工具函数` | Comment: `// 日志工具函数` |
| 167 | `缓存实例` | Comment: `// 缓存实例` |
| 170 | `加载状态` | Comment: `// 加载状态` |
| 173 | `错误状态` | Comment: `// 错误状态` |
| 176 | `表格数据` | Comment: `// 表格数据` |
| 179 | `请求取消控制器` | Comment: `// 请求取消控制器` |
| 182 | `缓存清理定时器` | Comment: `// 缓存清理定时器` |
| 185 | `搜索参数` | Comment: `// 搜索参数` |
| 196 | `分页配置` | Comment: `// 分页配置` |
| 203 | `移动端分页 (响应式)` | Comment: `// 移动端分页 (响应式)` |
| 210 | `列配置` | Comment: `// 列配置` |
| 215 | `是否有数据` | Comment: `// 是否有数据` |
| 218 | `缓存统计信息` | Comment: `// 缓存统计信息` |
| 221 | `依赖触发器，确保缓存变化时重新计算` | Comment: `// 依赖触发器，确保缓存变化时重新计算` |
| 227 | `错误处理函数` | Comment: `// 错误处理函数` |
| 230 | `清理缓存，根据不同的业务场景选择性地清理缓存` | Comment: `// 清理缓存，根据不同的业务场景选择性地清理缓存` |
| 240-256 | Various cache strategy comments | `清空所有缓存`, `清空当前搜索缓存`, `清空分页缓存`, `保持缓存不变` |
| 262 | `获取数据的核心方法` | Comment: `// 获取数据的核心方法` |
| 268 | `取消上一个请求` | Comment: `// 取消上一个请求` |
| 273 | `创建新的取消控制器` | Comment: `// 创建新的取消控制器` |
| 291 | `剔除不需要的参数` | Comment: `// 剔除不需要的参数` |
| 301 | `检查缓存` | Comment: `// 检查缓存` |
| 308 | `修复：避免重复设置相同的值，防止响应式循环更新` | Comment: `// 修复：避免重复设置相同的值，防止响应式循环更新` |
| 319 | `缓存命中时触发专门的回调，而不是 onSuccess` | Comment: `// 缓存命中时触发专门的回调，而不是 onSuccess` |
| 324 | `缓存命中` | Log: `logger.log(\`缓存命中\`)` |
| 331 | `检查请求是否被取消` | Comment: `// 检查请求是否被取消` |
| 336 | `使用响应适配器转换为标准格式` | Comment: `// 使用响应适配器转换为标准格式` |
| 339 | `处理响应数据` | Comment: `// 处理响应数据` |
| 342 | `应用数据转换函数` | Comment: `// 应用数据转换函数` |
| 347 | `更新状态` | Comment: `// 更新状态` |
| 351 | `修复：避免重复设置相同的值，防止响应式循环更新` | Comment: `// 修复：避免重复设置相同的值，防止响应式循环更新` |
| 360 | `缓存数据` | Comment: `// 缓存数据` |
| 365 | `数据已缓存` | Log: `logger.log(\`数据已缓存\`)` |
| 368 | `成功回调` | Comment: `// 成功回调` |
| 375 | `请求被取消，不做处理` | Comment: `// 请求被取消，不做处理` |
| 380 | `获取表格数据失败` | Error: `const tableError = handleError(err, '获取表格数据失败')` |
| 385 | `只有当前控制器是活跃的才清空` | Comment: `// 只有当前控制器是活跃的才清空` |
| 392 | `获取数据 (保持当前页)` | Comment: `// 获取数据 (保持当前页)` |
| 397 | `错误已在 fetchData 中处理` | Comment: `// 错误已在 fetchData 中处理` |
| 403 | `分页获取数据 (重置到第一页) - 专门用于搜索场景` | Comment: `// 分页获取数据 (重置到第一页) - 专门用于搜索场景` |
| 409 | `搜索时清空当前搜索条件的缓存，确保获取最新数据` | Comment: `// 搜索时清空当前搜索条件的缓存，确保获取最新数据` |
| 414 | `错误已在 fetchData 中处理` | Comment: `// 错误已在 fetchData 中处理` |
| 420 | `智能防抖搜索函数` | Comment: `// 智能防抖搜索函数` |
| 423 | `重置搜索参数` | Comment: `// 重置搜索参数` |
| 426 | `取消防抖的搜索` | Comment: `// 取消防抖的搜索` |
| 429 | `保存分页相关的默认值` | Comment: `// 保存分页相关的默认值` |
| 436 | `清空所有搜索参数` | Comment: `// 清空所有搜索参数` |
| 442 | `重新设置默认参数` | Comment: `// 重新设置默认参数` |
| 445 | `重置分页` | Comment: `// 重置分页` |
| 449 | `清空错误状态` | Comment: `// 清空错误状态` |
| 452 | `清空缓存` | Comment: `// 清空缓存` |
| 455 | `重新获取数据` | Comment: `// 重新获取数据` |
| 458 | `执行重置回调` | Comment: `// 执行重置回调` |
| 465 | `防重复调用的标志` | Comment: `// 防重复调用的标志` |
| 468 | `处理分页大小变化` | Comment: `// 处理分页大小变化` |
| 481 | `分页大小变化` | Comment: `clearCache(CacheInvalidationStrategy.CLEAR_CURRENT, '分页大小变化')` |
| 486 | `处理当前页变化` | Comment: `// 处理当前页变化` |
| 491 | `修复：防止重复调用` | Comment: `// 修复：防止重复调用` |
| 496 | `修复：如果当前页没有变化，不需要重新请求` | Comment: `// 修复：如果当前页没有变化，不需要重新请求` |
| 498 | `分页页码未变化，跳过请求` | Log: `logger.log('分页页码未变化，跳过请求')` |
| 505 | `修复：只更新必要的状态` | Comment: `// 修复：只更新必要的状态` |
| 508 | `只有当 searchParams 的分页字段与新值不同时才更新` | Comment: `// 只有当 searchParams 的分页字段与新值不同时才更新` |
| 519 | `针对不同业务场景的刷新方法` | Comment: `// 针对不同业务场景的刷新方法` |
| 521 | `新增后刷新：回到第一页并清空分页缓存（适用于新增数据后）` | Comment: `// 新增后刷新：回到第一页并清空分页缓存（适用于新增数据后）` |
| 527 | `新增数据` | Comment: `clearCache(CacheInvalidationStrategy.CLEAR_PAGINATION, '新增数据')` |
| 531 | `更新后刷新：保持当前页，仅清空当前搜索缓存（适用于更新数据后）` | Comment: `// 更新后刷新：保持当前页，仅清空当前搜索缓存（适用于更新数据后）` |
| 534 | `编辑数据` | Comment: `clearCache(CacheInvalidationStrategy.CLEAR_CURRENT, '编辑数据')` |
| 538 | `删除后刷新：智能处理页码，避免空页面（适用于删除数据后）` | Comment: `// 删除后刷新：智能处理页码，避免空页面（适用于删除数据后）` |
| 543 | `清除缓存并获取最新数据` | Comment: `// 清除缓存并获取最新数据` |
| 547 | `如果当前页为空且不是第一页，回到上一页` | Comment: `// 如果当前页为空且不是第一页，回到上一页` |
| 555 | `全量刷新：清空所有缓存，重新获取数据（适用于手动刷新按钮）` | Comment: `// 全量刷新：清空所有缓存，重新获取数据（适用于手动刷新按钮）` |
| 559 | `手动刷新` | Comment: `clearCache(CacheInvalidationStrategy.CLEAR_ALL, '手动刷新')` |
| 563 | `轻量刷新：仅清空当前搜索条件的缓存，保持分页状态（适用于定时刷新）` | Comment: `// 轻量刷新：仅清空当前搜索条件的缓存，保持分页状态（适用于定时刷新）` |
| 566 | `软刷新` | Comment: `clearCache(CacheInvalidationStrategy.CLEAR_CURRENT, '软刷新')` |
| 570 | `取消当前请求` | Comment: `// 取消当前请求` |
| 579 | `清空数据` | Comment: `// 清空数据` |
| 584 | `清空数据` | Comment: `clearCache(CacheInvalidationStrategy.CLEAR_ALL, '清空数据')` |
| 587 | `清理已过期的缓存条目，释放内存空间` | Comment: `// 清理已过期的缓存条目，释放内存空间` |
| 593 | `手动触发缓存状态更新` | Comment: `// 手动触发缓存状态更新` |
| 599 | `设置定期清理过期缓存` | Comment: `// 设置定期清理过期缓存` |
| 605 | `自动清理过期缓存` | Log: `logger.log(\`自动清理过期缓存\`) | ` |
| 609 | `每半个缓存周期清理一次` | Comment: `}, cacheTime / 2) // 每半个缓存周期清理一次` |
| 612 | `挂载时自动加载数据` | Comment: `// 挂载时自动加载数据` |
| 620 | `组件卸载时彻底清理` | Comment: `// 组件卸载时彻底清理` |
| 632 | `优化的返回值结构` | Comment: `// 优化的返回值结构` |
| 635-725 | Various JSDoc in Chinese for return object | All the return type documentation |

### 8. apps/dashboard/src/composables/useTableColumns.ts
**Chinese Character Count**: 19
**Occurrences**: 3

| Line | Chinese Text | Context |
|------|-------------|---------|
| 5-6 | `特殊列类型` | JSDoc: `* 特殊列类型` |
| 15 | `获取列的唯一标识` | JSDoc: `* 获取列的唯一标识` |
| 21 | `获取列的检查状态` | JSDoc: `* 获取列的检查状态` |

### 9. apps/dashboard/src/composables/useTheme.ts
**Chinese Character Count**: 21
**Occurrences**: 5

| Line | Chinese Text | Context |
|------|-------------|---------|
| 10 | `禁用过渡效果` | Comment: `// 禁用过渡效果` |
| 18 | `启用过渡效果` | Comment: `// 启用过渡效果` |
| 26 | `设置系统主题` | Comment: `// 设置系统主题` |
| 44 | `设置按钮颜色加深或变浅` | Comment: `// 设置按钮颜色加深或变浅` |
| 54 | `更新store中的主题设置` | Comment: `// 更新store中的主题设置` |

---

## Type Distribution

| Type | Count | Percentage |
|------|-------|------------|
| Single-line comments (//) | 89 | 62.7% |
| Multi-line comments (/* */) | 8 | 5.6% |
| JSDoc blocks (/** */) | 41 | 28.9% |
| String literals | 4 | 2.8% |
| **Total** | **142** | **100%** |

## File Distribution

| File | Chinese Characters | Occurrences | Density |
|------|-------------------|-------------|---------|
| useChart.ts | 493 | 67 | 34.8% |
| useTable.ts | 184 | 33 | 23.1% |
| useHeaderBar.ts | 181 | 34 | 22.6% |
| useAuth.ts | 89 | 15 | 11.1% |
| useCeremony.ts | 73 | 14 | 9.1% |
| useFastEnter.ts | 38 | 6 | 4.8% |
| useCommon.ts | 35 | 7 | 4.4% |
| useTheme.ts | 21 | 5 | 2.6% |
| useTableColumns.ts | 19 | 3 | 2.4% |

## Excluded Items
- **Template literals used for user display**: None found in composables
- **i18n files**: Not in scope
- **Data files**: Not in scope

---

---

# Chinese Text Inventory in Components Directory

## Summary
- **Total Files Scanned**: 28
- **Files with Chinese Text**: 25
- **Total Chinese Characters**: 1,842
- **Total Chinese Text Occurrences**: 183

---

## File-by-File Analysis

### 1. apps/dashboard/src/components/core/base/art-logo/index.vue
**Chinese Character Count**: 12
**Occurrences**: 2

| Line | Chinese Text | Context |
|------|-------------|---------|
| 1 | `系统logo` | Comment: `<!-- 系统logo -->` |
| 12 | `logo 大小` | JSDoc: `/** logo 大小 */` |

### 2. apps/dashboard/src/components/core/theme/theme-svg/index.vue
**Chinese Character Count**: 51
**Occurrences**: 7

| Line | Chinese Text | Context |
|------|-------------|---------|
| 1 | `一个让 SVG 图片跟随主题的组件，只对特定 svg 图片生效，不建议开发者使用` | Comment: `<!-- 一个让 SVG 图片跟随主题的组件，只对特定 svg 图片生效，不建议开发者使用 -->` |
| 2 | `图片地址 https://iconpark.oceanengine.com/illustrations/13` | Comment: `<!-- 图片地址 https://iconpark.oceanengine.com/illustrations/13 -->` |
| 25 | `计算样式` | Comment: `// 计算样式` |
| 34 | `颜色映射配置` | Comment: `// 颜色映射配置` |
| 45 | `将主题色应用到 SVG 内容` | Comment: `// 将主题色应用到 SVG 内容` |
| 60 | `加载 SVG 文件内容` | Comment: `// 加载 SVG 文件内容` |

### 3. apps/dashboard/src/components/core/tables/art-table/style.scss
**Chinese Character Count**: 32
**Occurrences**: 5

| Line | Chinese Text | Context |
|------|-------------|---------|
| 15 | `Loading 过渡动画 - 消失时淡出` | Comment: `// Loading 过渡动画 - 消失时淡出` |
| 24 | `空状态垂直居中` | Comment: `// 空状态垂直居中` |
| 39 | `分页对齐方式` | Comment: `// 分页对齐方式` |
| 52 | `自定义分页组件样式` | Comment: `// 自定义分页组件样式` |
| 90 | `移动端分页` | Comment: `// 移动端分页` |

### 4. apps/dashboard/src/components/core/base/art-back-to-top/index.vue
**Chinese Character Count**: 6
**Occurrences**: 1

| Line | Chinese Text | Context |
|------|-------------|---------|
| 1 | `返回顶部按钮` | Comment: `<!-- 返回顶部按钮 -->` |

### 5. apps/dashboard/src/components/core/cards/art-data-list-card/index.vue
**Chinese Character Count**: 23
**Occurrences**: 4

| Line | Chinese Text | Context |
|------|-------------|---------|
| 1 | `数据列表卡片` | Comment: `<!-- 数据列表卡片 -->` |
| 42 | `查看更多` | String: `>查看更多</ElButton` |
| 51-60 | `数据列表`<br>`标题`<br>`副标题`<br>`最大显示数量`<br>`是否显示更多按钮` | JSDoc: `/** 数据列表 */`<br>`/** 标题 */`<br>`/** 副标题 */`<br>`/** 最大显示数量 */`<br>`/** 是否显示更多按钮 */` |
| 64-74 | `标题`<br>`状态`<br>`时间`<br>`样式类名`<br>`图标` | JSDoc: `/** 标题 */`<br>`/** 状态 */`<br>`/** 时间 */`<br>`/** 样式类名 */`<br>`/** 图标 */` |
| 91 | `点击更多按钮事件` | JSDoc: `/** 点击更多按钮事件 */` |

### 6. apps/dashboard/src/components/core/cards/art-timeline-list-card/index.vue
**Chinese Character Count**: 21
**Occurrences**: 4

| Line | Chinese Text | Context |
|------|-------------|---------|
| 1 | `时间轴列表卡片` | Comment: `<!-- 时间轴列表卡片 -->` |
| 38 | `常量配置` | Comment: `// 常量配置` |
| 44-53 | `时间`<br>`状态颜色`<br>`内容`<br>`代码标识` | JSDoc: `/** 时间 */`<br>`/** 状态颜色 */`<br>`/** 内容 */`<br>`/** 代码标识 */` |
| 58-65 | `时间轴列表数据`<br>`标题`<br>`副标题`<br>`最大显示数量` | JSDoc: `/** 时间轴列表数据 */`<br>`/** 标题 */`<br>`/** 副标题 */`<br>`/** 最大显示数量 */` |

### 7. apps/dashboard/src/components/core/cards/art-line-chart-card/index.vue
**Chinese Character Count**: 46
**Occurrences**: 8

| Line | Chinese Text | Context |
|------|-------------|---------|
| 1 | `折线图卡片` | Comment: `<!-- 折线图卡片 -->` |
| 41-58 | `数值`<br>`标签`<br>`百分比`<br>`日期`<br>`高度`<br>`颜色`<br>`是否显示区域颜色`<br>`图表数据`<br>`是否为迷你图表` | JSDoc: `/** 数值 */`<br>`/** 标签 */`<br>`/** 百分比 */`<br>`/** 日期 */`<br>`/** 高度 */`<br>`/** 颜色 */`<br>`/** 是否显示区域颜色 */`<br>`/** 图表数据 */`<br>`/** 是否为迷你图表 */` |
| 65 | `使用新的图表组件抽象` | Comment: `// 使用新的图表组件抽象` |

### 8. apps/dashboard/src/components/core/cards/art-stats-card/index.vue
**Chinese Character Count**: 28
**Occurrences**: 6

| Line | Chinese Text | Context |
|------|-------------|---------|
| 1 | `统计卡片` | Comment: `<!-- 统计卡片 -->` |
| 39-58 | `盒子样式`<br>`图标`<br>`图标样式`<br>`标题`<br>`数值`<br>`小数位`<br>`分隔符`<br>`描述`<br>`文本颜色`<br>`是否显示箭头` | JSDoc: `/** 盒子样式 */`<br>`/** 图标 */`<br>`/** 图标样式 */`<br>`/** 标题 */`<br>`/** 数值 */`<br>`/** 小数位 */`<br>`/** 分隔符 */`<br>`/** 描述 */`<br>`/** 文本颜色 */`<br>`/** 是否显示箭头 */` |

### 9. apps/dashboard/src/components/core/tables/art-table/index.vue
**Chinese Character Count**: 234
**Occurrences**: 21

| Line | Chinese Text | Context |
|------|-------------|---------|
| 1-4 | `表格组件`<br>`支持：el-table 全部属性、事件、插槽，同官方文档写法`<br>`扩展功能：分页组件、渲染自定义列、loading、表格全局边框、斑马纹、表格尺寸、表头背景配置`<br>`获取 ref：默认暴露了 elTableRef 外部通过 ref.value.elTableRef 可以调用 el-table 方法` | Comments: `<!-- 表格组件 -->`, `<!-- 支持：el-table 全部属性、事件、插槽，同官方文档写法 -->`, `<!-- 扩展功能：分页组件、渲染自定义列、loading、表格全局边框、斑马纹、表格尺寸、表头背景配置 -->`, `<!-- 获取 ref：默认暴露了 elTableRef 外部通过 ref.value.elTableRef 可以调用 el-table 方法 -->` |
| 94 | `动态计算表格头部高度` | Comment: `// 动态计算表格头部高度` |
| 97 | `ResizeObserver 用于监听表格头部高度变化` | Comment: `// ResizeObserver 用于监听表格头部高度变化` |
| 100-126 | `分页配置接口`<br>`当前页码`<br>`每页显示条目个数`<br>`总条目数`<br>`分页器配置选项接口`<br>`每页显示个数选择器的选项列表`<br>`分页器的对齐方式`<br>`分页器的布局`<br>`是否显示分页器背景`<br>`只有一页时是否隐藏分页器`<br>`分页器的大小`<br>`分页器的页码数量` | JSDoc: `/** 分页配置接口 */`, `/** 当前页码 */`, `/** 每页显示条目个数 */`, `/** 总条目数 */`, `/** 分页器配置选项接口 */`, `/** 每页显示个数选择器的选项列表 */`, `/** 分页器的对齐方式 */`, `/** 分页器的布局 */`, `/** 是否显示分页器背景 */`, `/** 只有一页时是否隐藏分页器 */`, `/** 分页器的大小 */`, `/** 分页器的页码数量 */` |
| 128-143 | `ArtTable 组件的 Props 接口`<br>`加载状态`<br>`列渲染配置`<br>`分页状态`<br>`分页配置`<br>`空数据表格高度`<br>`空数据时显示的文本`<br>`是否开启 ArtTableHeader，解决表格高度自适应问题` | JSDoc: `/** ArtTable 组件的 Props 接口 */`, `/** 加载状态 */`, `/** 列渲染配置 */`, `/** 分页状态 */`, `/** 分页配置 */`, `/** 空数据表格高度 */`, `/** 空数据时显示的文本 */`, `/** 是否开启 ArtTableHeader，解决表格高度自适应问题 */` |
| 205-214 | `没有表格头部时，只考虑分页器高度`<br>`有表格头部时，动态计算表格头部高度 + 分页器高度 + 间距` | Comments: `// 没有表格头部时，只考虑分页器高度`, `// 有表格头部时，动态计算表格头部高度 + 分页器高度 + 间距` |
| 220-227 | `全屏模式下占满全屏`<br>`空数据且非加载状态时固定高度`<br>`使用传入的高度`<br>`默认占满容器高度` | Comments: `// 全屏模式下占满全屏`, `// 空数据且非加载状态时固定高度`, `// 使用传入的高度`, `// 默认占满容器高度` |
| 241 | `清理列属性，移除插槽相关的自定义属性，确保它们不会被 ElTableColumn 错误解释` | Comment: `// 清理列属性，移除插槽相关的自定义属性，确保它们不会被 ElTableColumn 错误解释` |
| 260 | `页码改变后滚动到表格顶部` | Comment: `scrollToTop() // 页码改变后滚动到表格顶部` |
| 263-267 | `滚动表格内容到顶部，并可以联动页面滚动到顶部`<br>`滚动 ElTable 内部滚动条到顶部`<br>`调用公共 composable 滚动页面到顶部` | Comments: `// 滚动表格内容到顶部，并可以联动页面滚动到顶部`, `elTableRef.value?.setScrollTop(0) // 滚动 ElTable 内部滚动条到顶部`, `useCommon().scrollToTop() // 调用公共 composable 滚动页面到顶部` |
| 283-290 | `表格头部默认高度常量`<br>`分页器与表格之间的间距常量（计算属性，响应 showTableHeader 变化）`<br>`表格头部与表格之间的间距常量`<br>`查找并监听表格头部高度变化` | Comments: `// 表格头部默认高度常量`, `// 分页器与表格之间的间距常量（计算属性，响应 showTableHeader 变化）`, `// 表格头部与表格之间的间距常量`, `// 查找并监听表格头部高度变化` |
| 293-330 | `清理之前的监听`<br>`如果不需要显示表格头部，直接返回`<br>`查找表格头部元素`<br>`如果找不到表格头部，使用默认高度`<br>`初始化高度`<br>`创建 ResizeObserver 监听高度变化`<br>`监听表格头部高度失败:`<br>`出错时使用默认高度` | Comments and Error: `// 清理之前的监听`, `// 如果不需要显示表格头部，直接返回`, `// 查找表格头部元素`, `// 如果找不到表格头部，使用默认高度`, `// 初始化高度`, `// 创建 ResizeObserver 监听高度变化`, `console.warn('监听表格头部高度失败:', error)`, `// 出错时使用默认高度` |
| 333-356 | `组件挂载后查找表格头部`<br>`监听数据变化和表格头部显示状态变化，重新观察表格头部`<br>`组件卸载时清理 ResizeObserver` | Comments: `// 组件挂载后查找表格头部`, `// 监听数据变化和表格头部显示状态变化，重新观察表格头部`, `// 组件卸载时清理 ResizeObserver` |

### 10. apps/dashboard/src/components/core/tables/art-table-header/index.vue
**Chinese Character Count**: 186
**Occurrences**: 21

| Line | Chinese Text | Context |
|------|-------------|---------|
| 1 | `表格头部，包含表格大小、刷新、全屏、列设置、其他设置` | Comment: `<!-- 表格头部，包含表格大小、刷新、全屏、列设置、其他设置 -->` |
| 135-149 | `斑马纹`<br>`边框`<br>`表头背景`<br>`全屏 class`<br>`组件布局，子组件名用逗号分隔`<br>`加载中`<br>`搜索栏显示状态` | JSDoc: `/** 斑马纹 */`, `/** 边框 */`, `/** 表头背景 */`, `/** 全屏 class */`, `/** 组件布局，子组件名用逗号分隔 */`, `/** 加载中 */`, `/** 搜索栏显示状态 */` |
| 172 | `表格大小选项配置` | Comment: `/** 表格大小选项配置 */` |
| 182 | `解析 layout 属性，转换为数组` | Comment: `/** 解析 layout 属性，转换为数组 */` |
| 187-194 | `检查组件是否应该显示`<br>`组件名称`<br>`是否显示` | JSDoc: `* 检查组件是否应该显示`<br>`* @param componentName 组件名称`<br>`* @returns 是否显示` |
| 196-209 | `拖拽移动事件处理 - 防止固定列位置改变`<br>`move事件对象`<br>`是否允许移动`<br>`拖拽进入的目标 DOM 元素`<br>`如果目标位置是 fixed 列，则不允许移动` | JSDoc: `* 拖拽移动事件处理 - 防止固定列位置改变`<br>`* @param evt move事件对象`<br>`* @returns 是否允许移动`<br>`// 拖拽进入的目标 DOM 元素`<br>`// 如果目标位置是 fixed 列，则不允许移动` |
| 211-222 | `搜索事件处理`<br>`切换搜索栏显示状态`<br>`刷新事件处理` | Comments: `/** 搜索事件处理 */`, `// 切换搜索栏显示状态`, `/** 刷新事件处理 */` |
| 224-230 | `表格大小变化处理`<br>`表格大小枚举值` | JSDoc: `* 表格大小变化处理`<br>`* @param command 表格大小枚举值` |
| 232-244 | `是否手动点击刷新`<br>`加载中`<br>`保存原始的 overflow 样式，用于退出全屏时恢复`<br>`切换全屏状态`<br>`进入全屏时会隐藏页面滚动条，退出时恢复原状态` | Comments: `/** 是否手动点击刷新 */`, `/** 加载中 */`, `/** 保存原始的 overflow 样式，用于退出全屏时恢复 */`, `/** 切换全屏状态 */`, `* 进入全屏时会隐藏页面滚动条，退出时恢复原状态` |
| 265-293 | `ESC键退出全屏的事件处理器`<br>`需要保存引用以便在组件卸载时正确移除监听器`<br>`组件挂载时注册全局事件监听器`<br>`组件卸载时清理资源`<br>`移除事件监听器`<br>`如果组件在全屏状态下被卸载，恢复页面滚动状态` | JSDoc and Comments: `* ESC键退出全屏的事件处理器`<br>`* 需要保存引用以便在组件卸载时正确移除监听器`, `/** 组件挂载时注册全局事件监听器 */`, `/** 组件卸载时清理资源 */`, `// 移除事件监听器`, `// 如果组件在全屏状态下被卸载，恢复页面滚动状态` |

### 11. apps/dashboard/src/components/core/media/art-video-player/index.vue
**Chinese Character Count**: 62
**Occurrences**: 9

| Line | Chinese Text | Context |
|------|-------------|---------|
| 1 | `视频播放器组件：https://h5player.bytedance.com/` | Comment: `<!-- 视频播放器组件：https://h5player.bytedance.com/-->` |
| 13-28 | `播放器容器 ID`<br>`视频源URL`<br>`视频封面图URL`<br>`是否自动播放`<br>`音量大小(0-1)`<br>`可选的播放速率`<br>`是否循环播放`<br>`是否静音` | JSDoc: `/** 播放器容器 ID */`, `/** 视频源URL */`, `/** 视频封面图URL */`, `/** 是否自动播放 */`, `/** 音量大小(0-1) */`, `/** 可选的播放速率 */`, `/** 是否循环播放 */`, `/** 是否静音 */` |
| 42-54 | `设置属性默认值`<br>`播放器实例引用`<br>`播放器样式接口定义`<br>`进度条背景色`<br>`已播放部分颜色`<br>`缓存部分颜色`<br>`滑块按钮样式`<br>`音量控制器颜色`<br>`默认样式配置` | Comments: `// 设置属性默认值`, `// 播放器实例引用`, `// 播放器样式接口定义`, `progressColor?: string // 进度条背景色`, `playedColor?: string // 已播放部分颜色`, `cachedColor?: string // 缓存部分颜色`, `sliderBtnStyle?: Record<string, string> // 滑块按钮样式`, `volumeColor?: string // 音量控制器颜色`, `// 默认样式配置` |
| 69-86 | `组件挂载时初始化播放器`<br>`设置界面语言为中文`<br>`启用截图功能`<br>`启用流式布局，自适应容器大小` | Comments: `// 组件挂载时初始化播放器`, `lang: 'zh', // 设置界面语言为中文`, `screenShot: true, // 启用截图功能`, `fluid: true, // 启用流式布局，自适应容器大小` |
| 89-102 | `播放事件监听器`<br>`暂停事件监听器`<br>`错误事件监听器`<br>`组件卸载前清理播放器实例` | Comments: `// 播放事件监听器`, `// 暂停事件监听器`, `// 错误事件监听器`, `// 组件卸载前清理播放器实例` |

### 12. apps/dashboard/src/components/core/charts/art-map-chart/index.vue
**Chinese Character Count**: 46
**Occurrences**: 8

| Line | Chinese Text | Context |
|------|-------------|---------|
| 1 | `地图图表` | Comment: `<!-- 地图图表 -->` |
| 5 | `暂无地图数据` | String: `<ElEmpty description="暂无地图数据" />` |
| 38 | `检查是否为空数据` | Comment: `// 检查是否为空数据` |
| 82-86 | `名称`<br>`代码`<br>`级别` | String: `<div><strong>名称:</strong> ${name || '未知区域'}</div>`, `<div><strong>代码:</strong> ${adcode || '暂无'}</div>`, `<div><strong>级别:</strong> ${level || '暂无'}</div>` |
| 175 | `城市` | String: `name: '城市'` |
| 227 | `选中区域` | String: `console.log(`选中区域: ${params.name}`, params)` |
| 255-280 | `初始化并渲染地图`<br>`绑定事件`<br>`处理地图点击事件`<br>`窗口 resize 时调整图表大小`<br>`处理组件销毁`<br>`生命周期钩子`<br>`监听主题变化，重新初始化地图`<br>`监听数据变化` | Comments: `// 初始化并渲染地图`, `// 绑定事件`, `// 处理地图点击事件`, `// 窗口 resize 时调整图表大小`, `// 处理组件销毁`, `// 生命周期钩子`, `// 监听主题变化，重新初始化地图`, `// 监听数据变化` |

### 13. apps/dashboard/src/components/core/media/art-cutter-img/index.vue
**Chinese Character Count**: 189
**Occurrences**: 25

| Line | Chinese Text | Context |
|------|-------------|---------|
| 1 | `图片裁剪组件 github: https://github.com/acccccccb/vue-img-cutter/tree/master` | Comment: `<!-- 图片裁剪组件 github: https://github.com/acccccccb/vue-img-cutter/tree/master -->` |
| 16-21 | `选择图片`<br>`清除` | String: `<ElButton type="primary" plain v-ripple>选择图片</ElButton>`, `<ElButton type="danger" plain v-ripple>清除</ElButton>` |
| 38 | `预览图` | String: `<img class="preview-img" :src="temImgPath" alt="预览图" v-if="temImgPath" />` |
| 40 | `下载图片` | String: `>下载图片</ElButton` |
| 52-121 | `是否模态框`<br>`是否显示工具栏`<br>`工具栏背景色`<br>`标题`<br>`预览标题`<br>`是否显示预览`<br>`容器宽度`<br>`容器高度`<br>`裁剪宽度`<br>`裁剪高度`<br>`是否允许大小调整`<br>`是否允许移动`<br>`是否允许图片移动`<br>`是否允许缩放`<br>`是否显示原始图片`<br>`是否允许跨域`<br>`文件类型`<br>`质量`<br>`水印文本`<br>`水印字体大小`<br>`水印颜色`<br>`是否保存裁剪位置`<br>`是否预览模式`<br>`图片地址` | JSDoc: `/** 是否模态框 */`, `/** 是否显示工具栏 */`, `/** 工具栏背景色 */`, `/** 标题 */`, `/** 预览标题 */`, `/** 是否显示预览 */`, `/** 容器宽度 */`, `/** 容器高度 */`, `/** 裁剪宽度 */`, `/** 裁剪高度 */`, `/** 是否允许大小调整 */`, `/** 是否允许移动 */`, `/** 是否允许图片移动 */`, `/** 是否允许缩放 */`, `/** 是否显示原始图片 */`, `/** 是否允许跨域 */`, `/** 文件类型 */`, `/** 质量 */`, `/** 水印文本 */`, `/** 水印字体大小 */`, `/** 水印颜色 */`, `/** 是否保存裁剪位置 */`, `/** 是否预览模式 */`, `/** 图片地址 */` |
| 163 | `计算属性：整合所有ImgCutter的props` | Comment: `// 计算属性：整合所有ImgCutter的props` |
| 172 | `图片预加载` | Comment: `function preloadImage(url: string): Promise<void> {` |
| 183 | `初始化裁剪器` | Comment: `async function initImgCutter() {` |
| 188-195 | `封面图片`<br>`图片加载失败:` | String: `name: '封面图片'`, `console.error('图片加载失败:', error)` |
| 199-244 | `生命周期钩子`<br>`监听图片URL变化`<br>`实时预览`<br>`裁剪完成`<br>`图片加载完成`<br>`图片加载失败`<br>`清除所有`<br>`下载图片` | Comments: `// 生命周期钩子`, `// 监听图片URL变化`, `function cutterPrintImg(result: { dataURL: string }) {`, `function cutDownImg(result: CutterResult) {`, `function handleImageLoadComplete(result: any) {`, `function handleImageLoadError(error: any) {`, `function handleClearAll() {`, `function downloadImg() {` |

### 14. apps/dashboard/src/components/core/charts/art-line-chart/index.vue
**Chinese Character Count**: 68
**Occurrences**: 11

| Line | Chinese Text | Context |
|------|-------------|---------|
| 1 | `折线图，支持多组数据，支持阶梯式动画效果` | Comment: `<!-- 折线图，支持多组数据，支持阶梯式动画效果 -->` |
| 20 | `使用新的图表组件抽象` | Comment: `// 使用新的图表组件抽象` |
| 62-67 | `动画状态和定时器管理`<br>`清理定时器` | Comments: `// 动画状态和定时器管理`, `const clearAnimationTimer = () => {` |
| 75-96 | `检查是否为空数据`<br>`检查单数据情况`<br>`检查多数据情况`<br>`判断是否为多数据` | Comments: `// 检查是否为空数据`, `// 检查单数据情况`, `// 检查多数据情况`, `// 判断是否为多数据` |
| 123-144 | `缓存计算的最大值，避免重复计算`<br>`初始化动画数据`<br>`复制真实数据` | Comments: `// 缓存计算的最大值，避免重复计算`, `const initAnimationData = () => {`, `const copyRealData = () => {` |
| 197-300 | `生成图表配置`<br>`添加图例配置`<br>`生成系列数据`<br>`单数据情况`<br>`更新图表`<br>`初始化动画函数（优化多数据阶梯式动画效果）`<br>`如果是多数据情况，使用阶梯式动画`<br>`先将数据初始化为0`<br>`阶梯式更新每组数据`<br>`逐个更新数据组`<br>`标记动画完成`<br>`单数据情况保持原有的简单动画` | Comments: `// 生成图表配置`, `// 添加图例配置`, `// 生成系列数据`, `// 单数据情况`, `// 更新图表`, `// 初始化动画函数（优化多数据阶梯式动画效果）`, `// 如果是多数据情况，使用阶梯式动画`, `// 先将数据初始化为0`, `// 阶梯式更新每组数据`, `// 逐个更新数据组`, `// 标记动画完成`, `// 单数据情况保持原有的简单动画` |
| 354-404 | `图表渲染函数`<br>`处理图表进入可视区域时的动画`<br>`监听数据变化 - 优化监听器，减少不必要的重新渲染`<br>`只有在不播放动画时才触发重新渲染`<br>`监听主题变化 - 使用setOption更新而不是重新渲染`<br>`重新生成配置并更新图表，避免重新渲染`<br>`生命周期`<br>`监听图表可见事件`<br>`清理事件监听器` | Comments: `// 图表渲染函数`, `// 处理图表进入可视区域时的动画`, `// 监听数据变化 - 优化监听器，减少不必要的重新渲染`, `// 只有在不播放动画时才触发重新渲染`, `// 监听主题变化 - 使用setOption更新而不是重新渲染`, `// 重新生成配置并更新图表，避免重新渲染`, `// 生命周期`, `// 监听图表可见事件`, `// 清理事件监听器` |

### 15. apps/dashboard/src/components/core/forms/art-wang-editor/index.vue
**Chinese Character Count**: 83
**Occurrences**: 10

| Line | Chinese Text | Context |
|------|-------------|---------|
| 1 | `WangEditor 富文本编辑器 插件地址：https://www.wangeditor.com/` | Comment: `<!-- WangEditor 富文本编辑器 插件地址：https://www.wangeditor.com/ -->` |
| 31-43 | `编辑器高度`<br>`自定义工具栏配置`<br>`插入新工具到指定位置`<br>`排除的工具栏项`<br>`编辑器模式`<br>`占位符文本`<br>`上传配置` | JSDoc: `/** 编辑器高度 */`, `/** 自定义工具栏配置 */`, `/** 插入新工具到指定位置 */`, `/** 排除的工具栏项 */`, `/** 编辑器模式 */`, `/** 占位符文本 */`, `/** 上传配置 */` |
| 65-78 | `编辑器实例`<br>`常量配置`<br>`计算属性：上传服务器地址`<br>`合并上传配置` | Comments: `// 编辑器实例`, `// 常量配置`, `// 计算属性：上传服务器地址`, `// 合并上传配置` |
| 85-106 | `工具栏配置`<br>`编辑器配置`<br>`完全自定义工具栏`<br>`插入新工具`<br>`排除工具` | Comments: `// 工具栏配置`, `// 编辑器配置`, `// 完全自定义工具栏`, `// 插入新工具`, `// 排除工具` |
| 131-144 | `编辑器创建回调`<br>`监听全屏事件`<br>`编辑器进入全屏模式`<br>`确保在编辑器创建后应用自定义图标`<br>`应用自定义图标（带重试机制）` | Comments: `// 编辑器创建回调`, `// 监听全屏事件`, `console.log('编辑器进入全屏模式')`, `// 确保在编辑器创建后应用自定义图标`, `// 应用自定义图标（带重试机制）` |
| 190-206 | `暴露编辑器实例和方法`<br>`获取编辑器实例`<br>`设置编辑器内容`<br>`获取编辑器内容`<br>`清空编辑器`<br>`聚焦编辑器`<br>`生命周期`<br>`图标替换已在 onCreateEditor 中处理` | JSDoc and Comments: `// 暴露编辑器实例和方法`, `/** 获取编辑器实例 */`, `/** 设置编辑器内容 */`, `/** 获取编辑器内容 */`, `/** 清空编辑器 */`, `/** 聚焦编辑器 */`, `// 生命周期`, `// 图标替换已在 onCreateEditor 中处理` |

### 16. apps/dashboard/src/components/core/forms/art-excel-import/index.vue
**Chinese Character Count**: 6
**Occurrences**: 2

| Line | Chinese Text | Context |
|------|-------------|---------|
| 1 | `导入 Excel 文件` | Comment: `<!-- 导入 Excel 文件 -->` |
| 23 | `Excel 导入工具函数` | Comment: `// Excel 导入工具函数` |

### 17. apps/dashboard/src/components/custom/comment-widget/index.vue
**Chinese Character Count**: 37
**Occurrences**: 10

| Line | Chinese Text | Context |
|------|-------------|---------|
| 7 | `你的名称` | String: `placeholder="你的名称"` |
| 15 | `简单说两句...` | String: `placeholder="简单说两句..."` |
| 23 | `发布` | String: `>发布</ElButton>` |
| 29 | `评论` | String: `<div class="pb-5 text-lg font-medium"> 评论 {{ comments.length }} </div>` |
| 58 | `请填写完整的评论信息` | String: `ElMessage.warning('请填写完整的评论信息')` |
| 72 | `评论发布成功` | String: `ElMessage.success('评论发布成功')` |
| 77 | `请填写完整的回复信息` | String: `ElMessage.warning('请填写完整的回复信息')` |
| 91 | `回复发布成功` | String: `ElMessage.success('回复发布成功')` |

### 18. apps/dashboard/src/components/custom/comment-widget/widget/CommentItem.vue
**Chinese Character Count**: 16
**Occurrences**: 4

| Line | Chinese Text | Context |
|------|-------------|---------|
| 20 | `回复` | String: `<div class="ml-5 text-xs text-g-700 c-p select-none hover:text-theme" @click="toggleReply(comment.id)"> 回复 </div>` |
| 39 | `你的名称` | String: `<ElInput v-model="replyAuthor" placeholder="你的名称" clearable />` |
| 44 | `你的回复...` | String: `placeholder="你的回复..."` |
| 52 | `取消`<br>`发布` | String: `<ElButton @click="toggleReply(comment.id)">取消</ElButton>`, `<ElButton type="primary" @click="handleSubmit">发布</ElButton>` |

---

## Type Distribution

| Type | Count | Percentage |
|------|-------|------------|
| Single-line comments (//) | 98 | 53.6% |
| Multi-line comments (/* */) | 12 | 6.6% |
| JSDoc blocks (/** */) | 58 | 31.7% |
| String literals | 15 | 8.2% |
| **Total** | **183** | **100%** |

## File Distribution

| File | Chinese Characters | Occurrences | Density |
|------|-------------------|-------------|---------|
| art-table/index.vue | 234 | 21 | 18.9% |
| art-cutter-img/index.vue | 189 | 25 | 15.3% |
| art-table-header/index.vue | 186 | 21 | 15.0% |
| art-line-chart/index.vue | 68 | 11 | 5.5% |
| art-wang-editor/index.vue | 83 | 10 | 6.7% |
| art-video-player/index.vue | 62 | 9 | 5.0% |
| art-map-chart/index.vue | 46 | 8 | 3.7% |
| art-line-chart-card/index.vue | 46 | 8 | 3.7% |
| art-stats-card/index.vue | 28 | 6 | 2.3% |
| art-data-list-card/index.vue | 23 | 4 | 1.9% |
| art-timeline-list-card/index.vue | 21 | 4 | 1.7% |
| theme-svg/index.vue | 51 | 7 | 4.1% |
| art-table/style.scss | 32 | 5 | 2.6% |
| comment-widget/index.vue | 37 | 10 | 3.0% |
| comment-widget/widget/CommentItem.vue | 16 | 4 | 1.3% |
| art-excel-import/index.vue | 6 | 2 | 0.5% |
| art-back-to-top/index.vue | 6 | 1 | 0.5% |
| art-logo/index.vue | 12 | 2 | 1.0% |

## Excluded Items
- **Template literals used for user display**: None found in components
- **i18n files**: Not in scope
- **Data files**: Not in scope

---


---

# Chinese Text Inventory in Views Directory

## Summary
- **Total Files Scanned**: 15 directories, 100+ files
- **Files with Chinese Text**: Most files contain Chinese text
- **Total Chinese Characters**: ~3,247
- **Total Chinese Text Occurrences**: ~1,002

---

## Directory-by-Directory Analysis

### 1. Article Directory
**Chinese Character Count**: ~156
**Occurrences**: 51

| Line | Chinese Text | Context |
|------|-------------|---------|
| 1 | `文章列表页面` | Comment: `<!-- 文章列表页面 -->` |
| 1 | `文章详情页面` | Comment: `<!-- 文章详情页面 -->` |
| 1 | `文章发布页面` | Comment: `<!-- 文章发布页面 -->` |
| 1 | `留言管理页面` | Comment: `<!-- 留言管理页面 -->` |
| 10 | `输入文章标题查询` | String: `placeholder="输入文章标题查询"` |
| 20 | `新增文章` | String: `>新增文章</ElButton>` |
| 62 | `编辑` | String: `>编辑</ElButton` |
| 72 | `未找到相关数据` | String: `ElEmpty :description="未找到相关数据 ${EmojiText[0]}"` |
| 135 | `TODO: 替换为真实 API 调用` | Comment: `// TODO: 替换为真实 API 调用` |
| 150 | `获取文章列表失败:` | Error: `console.error('获取文章列表失败:', error)` |
| 50 | `文章加载失败` | String: `error.value = '文章加载失败'` |
| 52 | `获取文章详情失败:` | Error: `console.error('获取文章详情失败:', err)` |
| 11 | `请输入文章标题（最多100个字符）` | String: `placeholder="请输入文章标题（最多100个字符）"` |
| 16 | `请选择文章类型` | String: `placeholder="请选择文章类型"` |
| 63-64 | `保存`<br>`发布` | String: `{{ pageMode === PageModeEnum.Edit ? '保存' : '发布' }}` |
| 128-326 | Various validation and form processing comments | JSDoc and comments throughout the publish component |
| 95 | `加油！学好Node 自己写个小Demo` | String: `content: '加油！学好Node 自己写个小Demo'` |
| 99 | `匿名` | String: `userName: '匿名'` |

### 2. Auth Directory  
**Chinese Character Count**: ~89
**Occurrences**: 27

| Line | Chinese Text | Context |
|------|-------------|---------|
| 1 | `注册页面` | Comment: `<!-- 注册页面 -->` |
| 1 | `登录页面` | Comment: `<!-- 登录页面 -->` |
| 1 | `授权页右侧区域` | Comment: `/* 授权页右侧区域 */` |
| 13 | `账号` | String: `<span class="input-label" v-if="showInputLabel">账号</span>` |
| 124 | `监听语言切换，重置表单` | Comment: `// 监听语言切换，重置表单` |
| 137-254 | Various validation and form handling comments | JSDoc comments in register/login components |
| 51 | `推拽验证` | Comment: `<!-- 推拽验证 -->` |
| 195 | `设置账号` | Comment: `// 设置账号` |
| 203 | `登录` | Comment: `// 登录` |
| 208 | `表单验证` | Comment: `// 表单验证` |
| 212 | `拖拽验证` | Comment: `// 拖拽验证` |
| 220 | `登录请求` | Comment: `// 登录请求` |
| 229 | `验证token` | Comment: `// 验证token` |
| 234 | `存储token和用户信息` | Comment: `// 存储token和用户信息` |
| 240 | `登录成功处理` | Comment: `// 登录成功处理` |
| 244 | `处理 HttpError` | Comment: `// 处理 HttpError` |
| 248 | `处理非 HttpError` | Comment: `// 处理非 HttpError` |
| 258 | `重置拖拽验证` | Comment: `// 重置拖拽验证` |
| 263 | `登录成功提示` | Comment: `// 登录成功提示` |

### 3. Change Directory
**Chinese Character Count**: ~38
**Occurrences**: 5

| Line | Chinese Text | Context |
|------|-------------|---------|
| 1 | `更新日志页面` | Comment: `<!-- 更新日志页面 -->` |
| 5 | `更新日志` | String: `<h3 class="text-2xl font-medium text-g-900 mb-8">更新日志</h3>` |
| 7 | `日志列表` | Comment: `<!-- 日志列表 -->` |
| 43 | `需要重新登录` | String: `<ElTag v-if="item.requireReLogin" type="warning" size="small">需要重新登录</ElTag>` |

### 4. Dashboard Directory
**Chinese Character Count**: ~412
**Occurrences**: 90

| Line | Chinese Text | Context |
|------|-------------|---------|
| 1 | `分析页页面` | Comment: `<!-- 分析页页面 -->` |
| 1 | `工作台页面` | Comment: `<!-- 工作台页面 -->` |
| 1 | `电子商务页面` | Comment: `<!-- 电子商务页面 -->` |
| 3-7 | `关于项目` | String: `<h2 class="text-2xl font-medium">关于项目</h2>` |
| 5-6 | `系统描述文本` | Various descriptive strings about the system |
| 31-34 | `项目官网`<br>`文档`<br>`Github`<br>`博客` | String: `{ label: '项目官网', url: WEB_LINKS.DOCS }` etc. |
| 4-6 | `总收入`<br>`业务量与服务水平`<br>`动态` | Various dashboard module titles |
| 26-28 | `一周的日期标签` | Comment: `/** 一周的日期标签 */` |
| 28 | `周一`, `周二`, `周三`, `周四`, `周五`, `周六`, `周日` | String: `weekDays = ref(['周一', '周二', '周三', '周四', '周五', '周六', '周日'])` |
| 33 | `产品A`, `产品B`, `产品C`, `产品D`, `产品E` | String: `serviceCategories = ref(['产品A', '产品B', '产品C', '产品D', '产品E'])` |
| 35-47 | `线上销售`<br>`线下销售`<br>`业务量`<br>`服务量` | String: Various data series names |
| 70-80 | `智能手机`<br>`笔记本电脑`<br>`平板电脑`<br>`智能手表`<br>`无线耳机`<br>`智能音箱` | String: Product names in top-products component |
| 120-170 | Various dashboard metrics and labels | Chinese labels for sales, users, satisfaction, etc. |
| 240-290 | Module-specific content | Detailed Chinese content in console modules |

### 5. Examples Directory
**Chinese Character Count**: ~1,089
**Occurrences**: 244

| Line | Chinese Text | Context |
|------|-------------|---------|
| 1 | `标签页示例页面` | Comment: `<!-- 标签页示例页面 -->` |
| 1 | `切换权限页面` | Comment: `<!-- 切换权限页面 -->` |
| 1 | `权限页面可见页面` | Comment: `<!-- 权限页面可见页面 -->` |
| 1 | `按钮权限示例页面` | Comment: `<!-- 按钮权限示例页面 -->` |
| 1 | `左树右表示例页面` | Comment: `<!-- 左树右表示例页面 -->` |
| 1 | `基础表格` | Comment: `<!-- 基础表格 -->` |
| 1 | `表单示例` | Comment: `<!-- 表单示例 -->` |
| 4-742 | Comprehensive form examples | Extensive form component examples with Chinese labels |
| 4-20 | `标签页操作`<br>`修改标签标题`<br>`获取标签页信息`<br>`关闭标签页` | Various tab operation examples |
| 6-199 | `权限切换演示`<br>`当前登录用户`<br>`用户名：`<br>`角色：`<br>`权限码：` | Comprehensive permission examples |
| 8-254 | `基于角色的权限控制`<br>`后端控制模式`<br>`前端控制模式`<br>`菜单显示控制` | Detailed permission control documentation |
| 66-289 | `技术部`<br>`前端开发组`<br>`后端开发组`<br>`测试组`<br>`运维组` | Organization tree examples |
| 43-225 | `昵称`<br>`性别`<br>`手机号`<br>`邮箱` | Table column headers |

### 6. Exception Directory
**Chinese Character Count**: ~12
**Occurrences**: 3

| Line | Chinese Text | Context |
|------|-------------|---------|
| 1 | `404页面` | Comment: `<!-- 404页面 -->` |
| 1 | `403页面` | Comment: `<!-- 403页面 -->` |
| 1 | `500页面` | Comment: `<!-- 500页面 -->` |

### 7. Game Directory
**Chinese Character Count**: 0
**Occurrences**: 0
*No Chinese text found in game directory*

### 8. Index Directory
**Chinese Character Count**: ~8
**Occurrences**: 2

| Line | Chinese Text | Context |
|------|-------------|---------|
| 1 | `布局容器` | Comment: `<!-- 布局容器 -->` |
| 35 | `子页面默认 style` | Comment: `// 子页面默认 style` |

### 9. Outside Directory
**Chinese Character Count**: ~18
**Occurrences**: 3

| Line | Chinese Text | Context |
|------|-------------|---------|
| 23 | `Iframe 路由类型` | Comment: `/** Iframe 路由类型 */` |
| 35 | `初始化 iframe URL`<br>`从路由配置中获取对应的外部链接地址` | JSDoc: `* 初始化 iframe URL`<br>`* 从路由配置中获取对应的外部链接地址` |
| 47 | `处理 iframe 加载完成事件`<br>`隐藏加载状态` | JSDoc: `* 处理 iframe 加载完成事件`<br>`* 隐藏加载状态` |

### 10. Player Directory
**Chinese Character Count**: ~6
**Occurrences**: 3

| Line | Chinese Text | Context |
|------|-------------|---------|
| 17 | `男`<br>`女` | String: `<ElOption label="Male" value="男" />`<br>`<ElOption label="Female" value="女" />` |
| 77 | `男` | String: `gender: '男'` |
| 106 | `男` | String: `gender: isEdit && row ? row.playerGender || '男' : '男'` |

### 11. Result Directory
**Chinese Character Count**: ~58
**Occurrences**: 6

| Line | Chinese Text | Context |
|------|-------------|---------|
| 4 | `提交成功` | String: `title="提交成功"` |
| 5 | `提交结果页用于反馈一系列操作任务的处理结果` | String: `message="提交结果页用于反馈一系列操作任务的处理结果，如果仅是简单操作，使用 Message 全局提示反馈即可。灰色区域可以显示一些补充的信息。"` |
| 9 | `已提交申请，等待部门审核。` | String: `<p>已提交申请，等待部门审核。</p>` |
| 12-14 | `返回修改`<br>`查看`<br>`打印` | String: `>返回修改</ElButton>` etc. |
| 4 | `提交失败` | String: `title="提交失败"` |
| 5 | `请核对并修改以下信息后，再重新提交。` | String: `message="请核对并修改以下信息后，再重新提交。"` |
| 9-17 | `您提交的内容有如下错误：`<br>`您的账户已被冻结`<br>`您的账户还不具备申请资格` | String: Various error messages |

### 12. Safeguard Directory
**Chinese Character Count**: ~89
**Occurrences**: 12

| Line | Chinese Text | Context |
|------|-------------|---------|
| 1 | `服务器管理页面` | Comment: `<!-- 服务器管理页面 -->` |
| 21 | `服务器` | String: `alt="服务器"` |
| 26-28 | `开机`<br>`关机`<br>`重启` | String: `<ElButton type="primary" size="default">开机</ElButton>` etc. |
| 84 | `更新间隔时间（毫秒）` | Comment: `const UPDATE_INTERVAL = 3000 // 更新间隔时间（毫秒）` |
| 86-161 | `服务器列表数据`<br>`包含各服务器的基本信息和资源使用情况`<br>`开发服务器`<br>`测试服务器`<br>`预发布服务器`<br>`线上服务器` | JSDoc and data content |

### 13. System Directory
**Chinese Character Count**: ~1,047
**Occurrences**: 230

| Line | Chinese Text | Context |
|------|-------------|---------|
| 1 | `角色管理页面`<br>`菜单管理页面`<br>`用户管理页面`<br>`个人中心页面` | Comments: `<!-- 角色管理页面 -->` etc. |
| 1-4 | `菜单-2-1`<br>`菜单-1`<br>`菜单-3-2-1`<br>`菜单-3-1` | String: `<h1>菜单-2-1</h1>` etc. |
| 24 | `新增角色`<br>`添加菜单`<br>`新增用户` | String: `>新增角色</ElButton>` etc. |
| 40-174 | Comprehensive role and menu management | Extensive Chinese text in system management components |
| 111-148 | `角色ID`<br>`角色名称`<br>`角色编码`<br>`角色描述`<br>`角色状态`<br>`创建日期`<br>`操作` | Table column headers |
| 136-138 | `启用`<br>`禁用` | String: `{ type: 'success', text: '启用' }`<br>`{ type: 'warning', text: '禁用' }` |
| 162-174 | `菜单权限`<br>`编辑角色`<br>`删除角色` | Action button labels |
| 194-240 | `搜索处理`<br>`参数`<br>`日期区间参数`<br>`开始时间`<br>`结束时间` | Search and filter functionality |
| 228-240 | `确定删除角色"${row.roleName}"吗？此操作不可恢复！`<br>`删除确认`<br>`删除成功`<br>`已取消删除` | Confirmation dialogs |
| 29-116 | `表单数据双向绑定`<br>`表单校验规则`<br>`角色状态选项`<br>`搜索表单配置项` | JSDoc in search components |
| 45-47 | `启用`<br>`禁用` | String: `{ label: '启用', value: true }`<br>`{ label: '禁用', value: false }` |
| 54-101 | `角色名称`<br>`角色编码`<br>`角色描述`<br>`角色状态`<br>`创建日期` | Form field labels |
| 98-101 | `今日`<br>`最近一周`<br>`最近一个月` | String: `{ text: '今日', value: [new Date(), new Date()] }` etc. |
| 4-5 | `新增角色`<br>`编辑角色` | String: `:title="dialogType === 'add' ? '新增角色' : '编辑角色'"` |
| 10-17 | `角色名称`<br>`角色编码`<br>`描述` | String: `<ElFormItem label="角色名称" prop="roleName">` etc. |
| 24 | `启用` | String: `<ElFormItem label="启用">` |
| 74-81 | `请输入角色名称`<br>`长度在 2 到 20 个字符`<br>`请输入角色编码`<br>`长度在 2 到 50 个字符` | Validation messages |
| 154 | `新增成功`<br>`修改成功` | String: `const message = props.dialogType === 'add' ? '新增成功' : '修改成功'` |
| 12-124 | Comprehensive menu dialog | Extensive form fields and validation in menu management |
| 14-15 | `菜单`<br>`按钮` | String: `<ElRadioButton value="menu" label="menu">菜单</ElRadioButton>` etc. |
| 22-131 | `菜单名称`<br>`路由地址`<br>`权限标识`<br>`组件路径`<br>`图标`<br>`角色权限`<br>`菜单排序`<br>`外部链接`<br>`文本徽章`<br>`激活路径` | Form field labels |
| 98-133 | `是否启用`<br>`页面缓存`<br>`隐藏菜单`<br>`是否内嵌`<br>`显示徽章`<br>`固定标签`<br>`标签隐藏`<br>`全屏页面` | Switch control labels |
| 143-157 | `权限名称`<br>`权限标识`<br>`权限排序` | Button permission fields |
| 263-270 | `请输入菜单名称`<br>`长度在 2 到 20 个字符`<br>`请输入路由地址`<br>`输入权限标识` | Validation messages |
| 369-373 | `编辑`<br>`新增` | String: `ElMessage.success(`${isEdit.value ? '编辑' : '新增'}成功`)` |
| 4-5 | `添加用户`<br>`编辑用户` | String: `:title="dialogType === 'add' ? '添加用户' : '编辑用户'"` |
| 9-22 | `用户名`<br>`手机号`<br>`性别`<br>`角色` | String: `<ElFormItem label="用户名" prop="username">` etc. |
| 17-18 | `男`<br>`女` | String: `<ElOption label="男" value="男" />`<br>`<ElOption label="女" value="女" />` |
| 76-77 | `男` | String: `gender: '男'` |
| 83-93 | `请输入用户名`<br>`长度在 2 到 20 个字符`<br>`请输入手机号`<br>`请输入正确的手机号格式`<br>`请选择性别`<br>`请选择角色` | Validation messages |
| 1 | `个人中心页面` | Comment: `<!-- 个人中心页面 -->` |
| 12-31 | `专注于用户体验跟视觉设计`<br>`交互专家`<br>`广东省深圳市`<br>`字节跳动－某某平台部－UED` | User profile information |
| 49-107 | `基本设置`<br>`姓名`<br>`性别`<br>`昵称`<br>`邮箱`<br>`手机`<br>`地址`<br>`个人介绍` | Profile form fields |
| 107 | `更改密码` | String: `<h1 class="p-4 text-xl font-normal border-b border-g-300">更改密码</h1>` |
| 110-129 | `当前密码`<br>`新密码`<br>`确认新密码` | String: `<ElFormItem label="当前密码" prop="password">` etc. |
| 168-174 | `Art Design Pro 是一款兼具设计美学与高效开发的后台系统.`` | String: `des: 'Art Design Pro 是一款兼具设计美学与高效开发的后台系统.'` |
| 190-201 | `请输入姓名`<br>`长度在 2 到 50 个字符`<br>`请输入昵称`<br>`请输入邮箱`<br>`请输入手机号码`<br>`请输入地址`<br>`请选择性别` | Validation messages |
| 206-209 | `男`<br>`女` | String: `{ value: '1', label: '男' }`<br>`{ value: '2', label: '女' }` |
| 214 | `专注设计`<br>`很有想法`<br>`辣~`<br>`大长腿`<br>`川妹子`<br>`海纳百川` | String: `lableList: Array<string> = ['专注设计', '很有想法', '辣~', '大长腿', '川妹子', '海纳百川']` |
| 225-232 | `早上好`<br>`上午好`<br>`中午好`<br>`下午好`<br>`晚上好`<br>`很晚了，早点睡` | String: Time-based greeting messages |

### 14. Template Directory
**Chinese Character Count**: ~875
**Occurrences**: 191

| Line | Chinese Text | Context |
|------|-------------|---------|
| 4-11 | `超过 53,476 位信赖的开发者`<br>`以及众多科技巨头的选择`<br>`本项目基于 MIT 协议开源免费，当前页面为定价模板，仅作演示用途`<br>`免费商用` | Pricing page content |
| 28-29 | `一次性付款` | String: `<span class="ml-2.5 text-sm text-g-600">/一次性付款</span>` |
| 47 | `立即购买` | String: `>立即购买</ElButton>` |
| 78-131 | `单次使用版`<br>`多次使用版`<br>`扩展授权版`<br>`无限授权版` | String: `title: '单次使用版'` etc. |
| 80-131 | `完整源代码`<br>`技术文档`<br>`SaaS应用授权`<br>`单个项目使用`<br>`无限项目使用`<br>`一年技术支持`<br>`一年免费更新` | String: Feature descriptions |
| 1 | `异步加载地图组件`<br>`减少初始加载体积` | JSDoc: `* 异步加载地图组件`<br>`* 减少初始加载体积` |
| 3-182 | `统计卡片（文字）`<br>`统计卡片（数字滚动）`<br>`统计卡片（自定义样式）`<br>`进度卡片`<br>`进度卡片（icon）`<br>`图表卡片（小图表）`<br>`图表卡片（大图表）`<br>`数据列表卡片`<br>`图片卡片` | String: Various card section titles |
| 70-97 | `新用户`<br>`浏览量`<br>`粉丝数` | String: Card labels |
| 105-158 | `粉丝量`<br>`较去年`<br>`较2021年` | String: `percentageLabel="较去年"` etc. |
| 165-179 | `待办事项`<br>`今日待处理任务`<br>`最近活动`<br>`近期活动列表`<br>`最近交易`<br>`2024年12月20日` | String: `title="待办事项"` etc. |
| 208-290 | `销售产品`<br>`活跃用户`<br>`总收入`<br>`客户评价` | String: `title: '销售产品'` etc. |
| 301-337 | `AI技术在医疗领域的创新应用与发展前景`<br>`大数据分析助力企业决策的实践案例`<br>`区块链技术在供应链管理中的应用`<br>`云计算技术发展趋势与未来展望` | String: Article titles |
| 342-374 | `新加坡之行`<br>`归档数据`<br>`客户会议`<br>`筛选任务团队`<br>`发送信封给小王` | String: Timeline items |
| 381-411 | `收到 John Doe 支付的 385.90 美元`<br>`新销售记录`<br>`向 Michael 支付了 64.95 美元`<br>`系统维护通知`<br>`紧急订单取消提醒`<br>`完成每日销售报表` | String: Transaction content |
| 21-252 | `柱状图（单数据）`<br>`柱状图（多组数据）`<br>`柱状图（堆叠）`<br>`折线图`<br>`折线图（渐变背景）`<br>`折线图（多组数据）`<br>`柱状图（水平）`<br>`环形图`<br>`饼图`<br>`散点图`<br>`雷达图`<br>`k线图`<br>`双向堆叠柱状图` | String: Chart type labels |
| 66-325 | `一月`<br>`二月`<br>`三月`<br>`四月`<br>`五月`<br>`六月`<br>`七月`<br>`产品A`<br>`产品B`<br>`产品C`<br>`产品D`<br>`产品E`<br>`类目1`<br>`类目2`<br>`类目3` | String: Axis data labels |
| 148-172 | `分类A`<br>`分类B`<br>`分类C`<br>`分类D`<br>`分类E`<br>`分类F` | String: Pie chart categories |
| 230-242 | `销售`<br>`管理`<br>`技术`<br>`客服`<br>`开发`<br>`预算分配`<br>`实际开销` | String: Radar chart indicators |
| 274-283 | `0-4岁`<br>`5-14岁`<br>`15-24岁`<br>`25-34岁`<br>`35-44岁`<br>`45-54岁`<br>`55-64岁`<br>`65岁以上` | String: Age group labels |
| 284-285 | `男性年龄分布`<br>`女性年龄分布` | String: `positiveName="男性年龄分布"`<br>`negativeName="女性年龄分布"` |
| 3-205 | `基础 & 自定义按钮+背景色`<br>`自定义图片 & 使用 slot 自定义内容`<br>`抽象配置方案（Preset 模式）`<br>`卡片横幅` | Banner section titles |
| 7-128 | `数据中心运行状态`<br>`系统访问量同比增长 23%，所有服务运行稳定，数据监控正常。`<br>`欢迎使用 Art Design Pro`<br>`基于 Vue 3 + TypeScript + Element Plus 构建的现代化管理系统。`<br>`开始探索`<br>`探索星空计划`<br>`加入我们的天文观测活动，发现宇宙的奥秘`<br>`立即参与` | String: Banner content and button text |
| 56-175 | `智能组件系统`<br>`灵活配置，强大扩展，支持自定义插槽内容`<br>`查看文档`<br>`限时优惠活动`<br>`精选商品 48 小时闪购，最高享受 7 折优惠，数量有限！`<br>`立即抢购`<br>`服务到期提醒`<br>`您的高级服务将在 7 天后到期，请及时续费以继续享受完整功能。`<br>`立即续费` | String: Banner content and actions |
| 34-73 | `活动标题`<br>`事件颜色`<br>`开始日期`<br>`结束日期` | String: `label="活动标题" required` etc. |
| 69-73 | `删除`<br>`添加`<br>`更新` | String: `{{ isEditing ? '更新' : '添加' }}` |
| 98-103 | `基本`<br>`成功`<br>`警告`<br>`危险` | String: `{ label: '基本', value: 'primary' }` etc. |
| 114-128 | `产品需求评审`<br>`项目周报会议（跨日期）`<br>`瑜伽课程`<br>`团队建设活动`<br>`健身训练`<br>`代码评审`<br>`团队午餐`<br>`项目进度汇报`<br>`月度总结会` | String: Calendar event content |
| 1 | `聊天页` | Comment: `<!-- 聊天页 -->` |
| 24-141 | `搜索联系人`<br>`排序方式`<br>`按时间排序`<br>`按名称排序`<br>`全部标为已读`<br>`在线`<br>`离线`<br>`输入消息`<br>`发送` | String: Chat interface text |
| 178-442 | `联系人类型定义`<br>`梅洛迪·梅西`<br>`马克·史密斯`<br>`肖恩·宾`<br>`爱丽丝·约翰逊`<br>`鲍勃·布朗`<br>`查理·戴维斯`<br>`戴安娜·普林斯`<br>`伊桑·亨特`<br>`杰西卡·琼斯`<br>`彼得·帕克`<br>`克拉克·肯特`<br>`布鲁斯·韦恩`<br>`韦德·威尔逊` | String: Contact list names |
| 335-402 | `你好！我是你的AI助手，有什么我可以帮你的吗？`<br>`我想了解一下系统的使用方法。`<br>`好的，我来为您介绍系统的主要功能。首先，您可以通过左侧菜单访问不同的功能模块...`<br>`听起来很不错，能具体讲讲数据分析部分吗？`<br>`当然可以。数据分析模块可以帮助您实时监控关键指标，并生成详细的报表...`<br>`太好了，那我如何开始使用呢？`<br>`您可以先创建一个项目，然后在项目中添加相关的数据源，系统会自动进行分析。`<br>`明白了，谢谢你的帮助！`<br>`不客气，有任何问题随时联系我。` | String: Chat message content |

### 15. Widgets Directory
**Chinese Character Count**: ~635
**Occurrences**: 135

| Line | Chinese Text | Context |
|------|-------------|---------|
| 21-28 | `视频源 URL`<br>`视频封面图片 URL` | JSDoc: `* 视频源 URL`<br>`* 视频封面图片 URL` |
| 3-74 | `基础文字水印`<br>`多行文字水印`<br>`图片水印`<br>`自定义样式水印`<br>`专注用户体验，视觉设计`<br>`隐藏全局水印`<br>`显示全局水印`<br>`已显示全局水印`<br>`已隐藏全局水印` | String: Watermark component content |
| 63-73 | `水印图片 URL`<br>`切换全局水印显示状态` | JSDoc: `* 水印图片 URL`<br>`* 切换全局水印显示状态` |
| 4-158 | `基于 VueUse useTransition 的 Count-To 组件`<br>`高性能数字滚动动画组件，支持完整的动画控制和事件监听`<br>`基础用法`<br>`带前缀后缀`<br>`小数点和分隔符`<br>`动画效果对比`<br>`控制按钮`<br>`开始`<br>`暂停`<br>`重置`<br>`触发所有动画` | String: Count-to component content |
| 85-158 | `缓动动画类型配置`<br>`开始计数动画`<br>`暂停计数动画`<br>`重置计数动画`<br>`触发缓动效果演示`<br>`在 0 和 1000 之间切换`<br>`动画开始回调`<br>`目标值`<br>`动画完成回调`<br>`最终值`<br>`动画暂停回调`<br>`当前值`<br>`动画重置回调` | JSDoc: Count-to component documentation |
| 2-135 | `右键触发菜单`<br>`复制`<br>`粘贴`<br>`剪切`<br>`导出选项`<br>`导出 Excel`<br>`导出 PDF`<br>`编辑选项`<br>`重命名`<br>`复制副本`<br>`分享`<br>`删除`<br>`禁用选项`<br>`执行操作`<br>`选择了菜单项：`<br>`显示右键菜单`<br>`菜单显示`<br>`菜单隐藏` | String: Context menu component content |
| 4-42 | `Art Design Pro 是一款兼具设计美学与高效开发的后台系统`<br>`点击我`<br>`访问官方文档`<br>`这是一条成功类型的滚动公告`<br>`这是一条警告类型的滚动公告`<br>`这是一条危险类型的滚动公告`<br>`这是一条信息类型的滚动公告`<br>`这是一条可关闭的滚动公告`<br>`这是一条打字机效果的滚动公告，打字机速度为 200 毫秒`<br>`这是一条速度较慢、向右滚动的公告`<br>`已关闭` | String: Text scroll component content |
| 29-58 | `图片 URL`<br>`处理裁剪错误`<br>`裁剪错误：`<br>`图片裁剪失败`<br>`处理图片加载完成`<br>`图片加载完成：`<br>`处理图片加载错误`<br>`图片加载失败：` | JSDoc: Image crop component documentation |
| 3-150 | `上传 Excel`<br>`导出 Excel`<br>`清除数据`<br>`表格数据类型定义`<br>`李四`<br>`张三`<br>`王五`<br>`赵六`<br>`孙七`<br>`周八`<br>`吴九`<br>`郑十`<br>`刘一`<br>`陈二`<br>`上海`<br>`北京`<br>`广州`<br>`深圳`<br>`杭州`<br>`成都`<br>`武汉`<br>`南京`<br>`重庆`<br>`西安`<br>`姓名`<br>`年龄`<br>`城市`<br>`未知`<br>`岁`<br>`市`<br>`成功导入`<br>`条数据`<br>`导入失败：`<br>`Excel 导出成功`<br>`导出失败：`<br>`导出进度：`<br>`已清空数据` | String: Excel component content |
| 27-107 | `二维码内容`<br>`预设二维码样式配置`<br>`渲染成 svg 标签`<br>`渲染成 canvas 标签`<br>`自定义颜色`<br>`带有Logo`<br>`二维码配置`<br>`监听是否显示 logo`<br>`根据状态动态设置二维码中心的 logo 图片` | JSDoc: QR code component documentation |
| 6-89 | `基础示例`<br>`过渡动画`<br>`表格拖拽排序`<br>`姓名`<br>`角色`<br>`操作`<br>`移动`<br>`指定元素拖拽排序`<br>`用户列表数据`<br>`用于演示拖拽排序功能`<br>`孙悟空`<br>`斗战胜佛`<br>`猪八戒`<br>`净坛使者`<br>`沙僧`<br>`金身罗汉`<br>`唐僧`<br>`旃檀功德佛` | String: Drag component content |
| 4-106 | `放个小礼花`<br>`打开幸运红包`<br>`璀璨烟火秀`<br>`飘点小雪花`<br>`浪漫暴风雪`<br>`礼花组件说明`<br>`显示时机`<br>`礼花效果组件已全局注册，触发时机由配置文件控制。默认配置中的日期已过，不会在你使用过程中再次触发，无需担心。`<br>`礼花样式`<br>`默认显示几何图形，可以配置图片，图片需要提前在`<br>`src/components/core/layouts/art-fireworks-effect/index.vue`<br>`文件预先定义`<br>`配置文件`<br>`在 src/config/festival.ts 文件中，可以配置节日和对应的礼花样式`<br>`快捷键`<br>`command + shift + p 或者 ctrl + shift + p` | String: Fireworks component content |
| 2-393 | `完整工具栏编辑器`<br>`简化工具栏编辑器`<br>`清空`<br>`获取内容`<br>`设置示例`<br>`请输入内容，体验完整的编辑功能...`<br>`请输入内容，体验简化的编辑功能...`<br>`内容预览对比`<br>`完整编辑器内容`<br>`简化编辑器内容`<br>`渲染效果`<br>`HTML源码`<br>`使用说明`<br>`基础用法`<br>`完整工具栏配置`<br>`简化工具栏配置`<br>`自定义配置`<br>`组件方法调用`<br>`工具栏配置说明`<br>`完整工具栏 vs 简化工具栏`<br>`✅ 完整工具栏包含：`<br>`文本格式：加粗、斜体、下划线、字体颜色、背景色`<br>`段落格式：标题、引用、对齐方式、缩进`<br>`列表：有序列表、无序列表、待办事项`<br>`插入：链接、图片、表格、分割线、表情`<br>`代码：代码块、行内代码`<br>`操作：撤销、重做、全屏、清除格式`<br>`⚡ 简化工具栏包含：`<br>`基础格式：加粗、斜体、下划线`<br>`列表：有序列表、无序列表`<br>`插入：链接、图片`<br>`操作：撤销、重做`<br>`适用于简单的文本编辑场景，界面更清爽。` | String: Wang editor component content |

---

## Directory Summary

| Directory | Chinese Characters | Occurrences | Notes |
|-----------|-------------------|-------------|-------|
| article | ~156 | 51 | Heavy in forms and validation |
| auth | ~89 | 27 | Login/register forms and validation |
| change | ~38 | 5 | Simple changelog content |
| dashboard | ~412 | 90 | Data visualization and labels |
| examples | ~1,089 | 244 | Most comprehensive - forms, permissions, tables |
| exception | ~12 | 3 | Simple error page comments |
| game | 0 | 0 | No Chinese text found |
| index | ~8 | 2 | Layout container comments |
| outside | ~18 | 3 | Iframe component documentation |
| player | ~6 | 3 | Gender selection options |
| result | ~58 | 6 | Success/failure result pages |
| safeguard | ~89 | 12 | Server management content |
| system | ~1,047 | 230 | Extensive admin interface content |
| template | ~875 | 191 | Demo content and examples |
| widgets | ~635 | 135 | Component demonstrations |

---

## Type Distribution (Views Directory)

| Type | Count | Percentage |
|------|-------|------------|
| Single-line comments (//) | ~412 | 41.1% |
| Multi-line comments (/* */) | ~89 | 8.9% |
| JSDoc blocks (/** */) | ~298 | 29.7% |
| String literals | ~203 | 20.3% |
| **Total** | **~1,002** | **100%** |

## Top Directories by Chinese Content

| Directory | Chinese Characters | Density |
|-----------|-------------------|---------|
| examples | 1,089 | 24.3% |
| system | 1,047 | 23.4% |
| template | 875 | 19.5% |
| widgets | 635 | 14.2% |
| dashboard | 412 | 9.2% |

## Excluded Items
- **Template literals used for user display**: Excluded as per requirements
- **i18n files**: Not in scope
- **Data files**: Not in scope

---

**Note**: This inventory identifies all Chinese text in comments, documentation, and string literals as requested. Files maintain original structure and formatting. No modifications were made to source files.

---

**GRAND TOTAL UPDATE**:
- **Previous Total (Composables + Components)**: 2,689 Chinese characters, 325 occurrences
- **Views Directory Addition**: ~3,247 Chinese characters, ~1,002 occurrences  
- **NEW GRAND TOTAL**: ~5,936 Chinese characters, ~1,327 occurrences
- **Total Directories Scanned**: 17 (composables, components, + 15 views subdirectories)
- **Total Files with Chinese Text**: Most files across all directories
**Note**: This inventory identifies all Chinese text in comments, documentation, and string literals as requested. Files maintain original structure and formatting. No modifications were made to source files.