# 详细设计
## INIT 的定位
+ **唯一一次**：每局只触发一次
+ **输出“世界锚点”**：给后续所有事件提供一致的世界观与主线目标
+ **定义玩家身份与初始目标**：让玩家知道“我是谁、我要做什么”
+ **直接进入循环**：INIT 完成后，下一事件通常进入 LOOP 中的事件类型（DECISION/COMBAT/PUZZLE），但由 AI 决定

## IN详细设计
### INIT::IN 结构定义
#### 1) INIT.IN（JSON）标准结构
> 目标：客户端/后台把“开局所需的事实”一次性给到模型，让模型输出 INIT.OUT，并在 OUT 里给出 next_event 建议。
>
> INIT 必须至少提供 1 个明确行动方向（可以是选项或自由行动提示）
>

```json
{
  "event": {
    "type": "INIT"
  },
  "session": {
    "session_id": "string",
    "player_count": 1,
    "difficulty": "EASY|NORMAL|HARD"
  },
  "time": {
    "hard_limit_seconds": 300,
    "elapsed_active_seconds": 0,
    "remaining_seconds": 300
  },
  "seed": {
    "run_seed": "string"
  },
  "constraints": {
    "language": "zh",
    "content_rating": "PG",
    "max_chars_scene": 220,
    "max_chars_option": 14,
    "forbidden_terms": ["骰子", "扑克", "点数", "规则"]
  },
  "slots": {
    "tone_bias": "温柔诡秘|热血冒险|黑色幽默",
    "theme_bias": "时间|梦境|遗失之物|人情交易",
    "npc_bias": "守门人|影子|未来自我|骗子"
  },
  "client_context": {
    "platform": "web|miniprogram|app",
    "locale": "zh-CN"
  }
}
```

---

#### 2) INIT.IN 参数说明（字段级契约）
##### event
+ `event.type` _(string, 必填)_
    - 固定为 `"INIT"`
    - 用于告诉模型：本次必须生成“开局事件”的 OUT

##### session
+ `session.session_id` _(string, 必填)_
    - 一局游戏的唯一标识（用于后端存取状态）
+ `session.player_count` _(int, 必填, >=1)_
    - 玩家人数（影响叙事口吻与互动描述）
+ `session.difficulty` _(enum, 必填)_
    - `"EASY" | "NORMAL" | "HARD"`
    - 用于控制：事件密度、风险强度、谜题难度、结局苛刻程度（具体规则后面再写）

##### time
+ `time.hard_limit_seconds` _(int, 必填)_
    - 固定 300（5分钟）
+ `time.elapsed_active_seconds` _(int, 必填, >=0)_
    - 当前局已消耗的“活跃交互时间”
    - INIT 通常为 0（或极小）
+ `time.remaining_seconds` _(int, 必填, >=0)_
    - 由后台计算：`hard_limit_seconds - elapsed_active_seconds`
    - INIT 通常为 300

> 说明：你现在先不写“硬收束规则”也可以，但字段要先立住。
>

##### seed
+ `seed.run_seed` _(string, 建议必填)_
    - 本局随机种子（可由后端生成）
    - 用于增强复现性/排查问题
    - **注意**：它不是 world_seed；world_seed 应由 AI 在 INIT.OUT 里生成

##### constraints（输出控制）
+ `constraints.language` _(string, 必填)_：`"zh"`
+ `constraints.content_rating` _(string, 可选)_：`"PG"` 等
+ `constraints.max_chars_scene` _(int, 必填)_：限制开场叙事长度
+ `constraints.max_chars_option` _(int, 必填)_：限制选项文本长度（若 INIT 需要选项）
+ `constraints.forbidden_terms` _(string[], 必填)_：避免模型把机制词说出来（你演示会更像游戏而不是说明书）

##### slots（可选词槽扰动）
+ `slots.tone_bias` _(string, 可选)_：偏好氛围
+ `slots.theme_bias` _(string, 可选)_：偏好主题
+ `slots.npc_bias` _(string, 可选)_：偏好 NPC 原型

> 词槽是你提的“后台动态填充词槽”的关键入口：同一套 Prompt + 不同 slots → 结果更不确定、更好玩。
>

##### client_context（可选）
+ `client_context.platform` _(enum, 可选)_：前端平台
+ `client_context.locale` _(string, 可选)_：地区/语言细分

---

#### 3) 提交时 Prompt 怎么结合 IN 一起提交（关键）


+ **IN（JSON）和 Prompt（文本模板）分开维护**
+ **后台调用大模型时把二者合并为一次请求**（同一个 LLM 请求里）

#### 推荐的单次投递形态
后台只发送“填槽后的 Prompt”给模型，IN JSON 仅用于后端解析、校验、记录与填槽，不直接发送给模型。

```latex
[INIT Prompt（规则说明，含输出必须为JSON、必须返回next_event建议等）]
```

然后后台把这段作为一次 `user` 消息（或等价内容）发给模型即可。

#### 后台“拿到 IN 后直接请求大模型”的最小动作清单
1. 校验 `event.type == INIT`
2. 补全/计算 `time.remaining_seconds`
3. 选择 INIT 专用 Prompt 模板（后端常量）
4. 必须用 IN 填充 Prompt 里的占位符（时间、难度、seed、language、slots）
5. 生成填槽后的 Prompt（不附带 IN JSON 原文）
6. 发起一次 LLM 调用
7. 期望模型返回 INIT.OUT（结构化 JSON）

---

如果你下一步要继续，我建议顺序是：

1. **INIT.OUT 结构与字段级契约**（并明确包含 `next_event.type`）
2. **INIT Prompt 模板正文**（你会看到哪些规则必须写死）

你说先做哪一个，我就只做那一个。

## OUT详细设计
### OUT 结构定义
### 1) INIT.OUT（JSON）标准结构
> 目标：开局一次性把“世界锚点 + 玩家身份 + 主线目标 + 开场场景 + 下一事件建议”返回给客户端/后台。
>
> 其中：routing.next_event_type允许值：DECISION | COMBAT | PUZZLE | END
>

```json
{
  "event": {
    "type": "INIT"
  },
  "ai_state": {
    "world_seed": "string",
    "title": "string",
    "tone": "string",
    "memory_summary": "string",
    "arc_progress": 0
  },
  "payload": {
    "mainline": {
      "premise": "string",
      "player_role": "string",
      "primary_goal": "string",
      "stakes": "string"
    },
    "opening": {
      "scene": "string",
      "npc_line": "string"
    },
    "start_hint": {
      "how_to_play_next": "string"
    },
    "options": [
      { "id": 1, "text": "string" },
      { "id": 2, "text": "string" }
    ]
  },
  "routing": {
    "next_event_type": "DECISION", 
    "should_end": false
  },
  "meta": {
    "trace_id": "string"
  }
}
```



---

### 2) INIT.OUT 字段说明
#### event
+ `event.type` _(string, 必填)_
    - 固定 `"INIT"`
    - 用于前端/后端识别当前事件类型

---

#### ai_state（AI 维护的“本局状态锚点”）
+ 协议规则：
    - INIT 事件必须将 arc_progress 固定为 0
    - arc_progress 仅在 LOOP 阶段由后续事件递增
    - 后端若检测到 INIT.OUT 的 arc_progress != 0，应视为模型输出异常
+ `ai_state.world_seed` _(string, 必填)_
    - 本局世界观锚点（后续事件必须保持一致）
+ `ai_state.title` _(string, 必填)_
    - 当前章节标题（可用于 UI 展示）
+ `ai_state.tone` _(string, 必填)_
    - 当前氛围（影响文风/节奏）
+ `ai_state.memory_summary` _(string, 必填)_
    - 剧情摘要（INIT 通常是“开局设定摘要”，为后续压缩提供锚点）
+ `ai_state.arc_progress` _(number/int, 必填)_
    - 剧情进度（INIT 通常从 0 或极小值开始）
    - INIT 默认固定为 0

> 说明：后端需要把 `ai_state` 整体存起来，下一事件 IN 里作为 `last_ai_state` 回传给模型。
>

---

#### payload（给玩家看的“开局内容”）
##### payload.mainline（主线框架）
+ `premise`：一句话故事前提（这局到底发生了什么）
+ `player_role`：玩家身份（玩家是谁）
+ `primary_goal`：主要目标（要做成什么算“完成”）
+ `stakes`：代价/风险/为什么要做（提高驱动力）

##### payload.opening（开场呈现）
+ `scene`：开场场景描述（短、抓人）
+ `npc_line`：NPC/DM 的一句引导台词（可选但很建议）

##### payload.start_hint（操作引导）
+ `how_to_play_next`：告诉玩家下一步怎么操作（例如“请选择一个行动”或“描述你要做的事”）

##### payload.options（开局第一步选择）
+ `options[]`：给出 2~3 个开局可选项
    - 如果你后面决定支持“自由输入”，也可以保留 options 但允许为空；这个等你后面定规则再锁。
    - INIT 必须至少提供 1 个明确行动方向（可以是选项或自由行动提示）

---

### routing（最关键：下一事件建议）
+ `routing.next_event_type` _(string, 必填)_
    - **AI 建议下一次要生成的事件类型**
    - 客户端/后端将用它来决定下一次请求时 `event.type` 应该是什么
+ `routing.should_end` _(bool, 必填)_
    - INIT 一般为 false（除非做极端：开局即结局）

> 你之前强调的点就在这里：  
INIT.OUT 必须显式告诉“下一事件是什么”，从而让下一次请求具备确定性。
>

---

### meta（可选）
+ `meta.trace_id` _(string, 可选但建议保留)_
    - 由后端生成
    - 用于日志追踪、回放与调试
    - 不依赖模型生成
    - 若模型输出 trace_id，后端可选择忽略并覆盖

---

如果你认可这版 INIT.OUT，我们下一步按你节奏来：  
你想先做 **INIT 的 Prompt**，还是先进入 **DECISION 事件的 IN**？

## PROMPT详细设计
### 设计原则
INIT Prompt 必须包含四类约束：

1. 身份约束（你是谁）
2. 时间约束（这是 5 分钟游戏）
3. 输出协议约束（必须输出 INIT.OUT 结构）
4. 未来衔接约束（必须给出 next_event_type）
5. 必须只输出 JSON，不允许任何额外解释文本
6. 只用词槽填充（更干净），不建议prompt里仍然绑定完整in的json

---

### INIT Prompt 模板骨架
这是后台持有的“固定模板”，  
后台会把 INIT.IN 的字段填入其中。

---

### INIT Prompt（模板版）
```latex
你是一个5分钟短局叙事游戏的DM。

本次任务：生成一次 INIT 事件。

【游戏规则说明】
- 本局总时长上限：{{time.hard_limit_seconds}} 秒
- 当前已消耗：{{time.elapsed_active_seconds}} 秒
- 剩余时间：{{time.remaining_seconds}} 秒
- 游戏难度：{{session.difficulty}}
- 玩家人数：{{session.player_count}}
- 本局随机种子：{{seed.run_seed}}

【生成目标】
你必须完成以下任务：
1. 建立本局世界观锚点（world_seed）
2. 定义玩家身份（player_role）
3. 定义主线目标（primary_goal）
4. 说明风险或代价（stakes）
5. 输出一个吸引人的开场场景（opening.scene）
6. 给出第一步行动提示（start_hint）
7. 生成 2~3 个开局选项（options）
8. 明确建议下一事件类型（routing.next_event_type）

【时间意识】
- 这是一个5分钟内完成的故事
- 设定必须可在有限时间内推进
- 不允许生成过于宏大的世界背景

【输出要求】
- 必须严格输出 JSON
- event.type 固定为 "INIT"
- 必须包含 ai_state
- 必须包含 routing.next_event_type（允许：DECISION | COMBAT | PUZZLE | END）
- 不要输出任何解释性文字
- 不要暴露游戏机制词汇
- 输出语言必须为 {{constraints.language}}

【风格倾向】
- tone_bias={{slots.tone_bias}}
- theme_bias={{slots.theme_bias}}
- npc_bias={{slots.npc_bias}}

【输出长度约束（来自 constraints）】
- opening.scene <= {{constraints.max_chars_scene}} 字
- 每个选项 text <= {{constraints.max_chars_option}} 字
- 禁止词：{{constraints.forbidden_terms}}

现在开始生成 INIT.OUT，只输出 JSON。
```

---

### 后台如何结合 INIT.IN 一起提交
后台做三步：

#### 第一步：填充 Prompt 占位符
把：

+ {{time.*}}
+ {{session.*}}
+ {{slots.*}}

替换为 INIT.IN 里的真实值。

---

#### 第二步：拼接完整请求
推荐结构：

```latex
[上面完整 INIT Prompt（已填充/填槽）]
```

注意：

+ Prompt 是规则
+ IN JSON 是后端事实输入（用于校验/计算/填槽/记录）
+ 模型侧只接收填槽后的 Prompt，不接收 IN JSON 原文

#### 第三步：单次请求大模型
+ 一次请求
+ 一次返回 INIT.OUT
+ 不分多轮

## 样例
### 1) INIT.IN 示例（后端/客户端传入，用于填槽）
> 说明：这是你们接口收到的 JSON；后端会校验/补全，然后填入 Prompt。
>

```json
{
  "event": { "type": "INIT" },
  "session": {
    "session_id": "sess_20260302_0001",
    "player_count": 1,
    "difficulty": "NORMAL"
  },
  "time": {
    "hard_limit_seconds": 300,
    "elapsed_active_seconds": 0,
    "remaining_seconds": 300
  },
  "seed": {
    "run_seed": "run_8f4c2a_0001"
  },
  "constraints": {
    "language": "zh",
    "content_rating": "PG",
    "max_chars_scene": 220,
    "max_chars_option": 14,
    "forbidden_terms": ["骰子", "扑克", "点数", "规则"]
  },
  "slots": {
    "tone_bias": "温柔诡秘",
    "theme_bias": "时间",
    "npc_bias": "守门人"
  },
  "client_context": {
    "platform": "web",
    "locale": "zh-CN"
  }
}
```

---

### 2) INIT Prompt（填槽后，真正发给大模型的内容）
> 说明：这是后端用 INIT.IN 填槽后的最终 Prompt；**你们只发这一段给模型**（不附带 IN JSON 原文）。
>
> 注意：Prompt 中凡是与 `constraints` 相关的规则（字数、禁用词等）应来自 IN 的填槽，以保证配置可动态调整；而事件类型枚举属于协议常量，可写死在 Prompt 中。
>

**未填槽**

```latex
你是一个5分钟短局叙事游戏的DM。

本次任务：生成一次 INIT 事件。

【游戏规则说明】
- 本局总时长上限：{{time.hard_limit_seconds}} 秒
- 当前已消耗：{{time.elapsed_active_seconds}} 秒
- 剩余时间：{{time.remaining_seconds}} 秒
- 游戏难度：{{session.difficulty}}
- 玩家人数：{{session.player_count}}
- 本局随机种子：{{seed.run_seed}}

【生成目标】
你必须完成以下任务：
1. 建立本局世界观锚点（world_seed）
2. 定义玩家身份（player_role）
3. 定义主线目标（primary_goal）
4. 说明风险或代价（stakes）
5. 输出一个吸引人的开场场景（opening.scene）
6. 给出第一步行动提示（start_hint）
7. 生成 2~3 个开局选项（options）
8. 明确建议下一事件类型（routing.next_event_type）

【时间意识】
- 这是一个5分钟内完成的故事
- 设定必须可在有限时间内推进
- 不允许生成过于宏大的世界背景

【输出要求】
- 必须严格输出 JSON
- event.type 固定为 "INIT"
- 必须包含 ai_state
- 必须包含 routing.next_event_type（允许：DECISION | COMBAT | PUZZLE | END）
- 不要输出任何解释性文字
- 不要暴露游戏机制词汇
- 输出语言必须为 {{constraints.language}}

【风格倾向】
- tone_bias={{slots.tone_bias}}
- theme_bias={{slots.theme_bias}}
- npc_bias={{slots.npc_bias}}

【输出长度约束（来自 constraints）】
- opening.scene <= {{constraints.max_chars_scene}} 字
- 每个选项 text <= {{constraints.max_chars_option}} 字
- 禁止词：{{constraints.forbidden_terms}}

现在开始生成 INIT.OUT，只输出 JSON。
```

**已填槽**

```latex
你是一个5分钟短局叙事游戏的DM。

本次任务：生成一次 INIT 事件。

【游戏规则说明】
- 本局总时长上限：300 秒
- 当前已消耗：0 秒
- 剩余时间：300 秒
- 游戏难度：NORMAL
- 玩家人数：1
- 本局随机种子：run_8f4c2a_0001

【生成目标】
你必须完成以下任务：
1. 建立本局世界观锚点（world_seed）
2. 定义玩家身份（player_role）
3. 定义主线目标（primary_goal）
4. 说明风险或代价（stakes）
5. 输出一个吸引人的开场场景（opening.scene）
6. 给出第一步行动提示（start_hint）
7. 生成 2~3 个开局选项（options）
8. 明确建议下一事件类型（routing.next_event_type）

【时间意识】
- 这是一个5分钟内完成的故事
- 设定必须可在有限时间内推进
- 不允许生成过于宏大的世界背景

【输出要求】
- 必须严格输出 JSON
- event.type 固定为 "INIT"
- 必须包含 ai_state
- 必须包含 routing.next_event_type（允许：DECISION | COMBAT | PUZZLE | END）
- 不要输出任何解释性文字
- 不要暴露游戏机制词汇
- 输出语言必须为 zh

【风格倾向】
- tone_bias=温柔诡秘
- theme_bias=时间
- npc_bias=守门人

【输出长度约束（来自 constraints）】
- opening.scene <= 220 字
- 每个选项 text <= 14 字
- 禁止词：骰子、扑克、点数、规则

现在开始生成 INIT.OUT，只输出 JSON。
```

---

### 3) INIT.OUT 预期示例（模型返回，前端/后端解析）
> 说明：这是一个“合格输出”的样子：
>
> + 必有 `world_seed`
> + 必有主线框架
> + 必有开局场景
> + 必有 options
> + 必有 `routing.next_event_type`
>

```json
{
  "event": { "type": "INIT" },
  "ai_state": {
    "world_seed": "钟塔会吞掉人的三分钟记忆，记忆会化成回声留在墙里；只有守门人能听懂回声的交易条件。",
    "title": "回声钟塔的门票",
    "tone": "温柔诡秘",
    "memory_summary": "你在钟塔入口醒来，守门人要你用一段记忆换取通行与线索，你必须在五分钟内夺回被吞掉的关键记忆。",
    "arc_progress": 0
  },
  "payload": {
    "mainline": {
      "premise": "一座钟塔正在偷走你的关键记忆，而你只剩很短时间夺回它。",
      "player_role": "你是被钟塔选中的来访者，手里握着一枚会变热的旧怀表。",
      "primary_goal": "在时间耗尽前，找到并取回被钟塔吞掉的那段关键记忆。",
      "stakes": "若失败，你会忘掉你最在意的人是谁；若成功，你将得到一次改写回声交易的机会。"
    },
    "opening": {
      "scene": "你站在钟塔门口，空气像被揉皱的纸。怀表在掌心发烫，指针倒着走。守门人从阴影里伸出一只手：『想进去？先把一段记忆放到我掌心。』",
      "npc_line": "『别急着说谎。钟塔只吃真实。』"
    },
    "start_hint": {
      "how_to_play_next": "请选择一个行动，或用一句话描述你要怎么做。"
    },
    "options": [
      { "id": 1, "text": "交出童年记忆" },
      { "id": 2, "text": "讨价还价试探" },
      { "id": 3, "text": "趁其不备闯入" }
    ]
  },
  "routing": {
    "next_event_type": "DECISION",
    "should_end": false
  },
  "meta": {
    "trace_id": "trace_sess_20260302_0001_0001"
  }
}
```

---

### 4) 后端最小实现步骤（开发者照做即可）
#### 4.1 接口（建议一个统一入口）
+ `POST /event`

#### 4.2 请求处理（INIT）
1. 解析 JSON，读 `event.type`
2. 若 `event.type != "INIT"`：走其他事件分支（后续再做）
3. 校验必填字段（session/time/constraints/seed/slots 可选）
4. 计算/修正：
    - `remaining_seconds = hard_limit_seconds - elapsed_active_seconds`（若前端没算或算错，以后端为准）
5. 选择 INIT Prompt 模板（后端常量）
6. 用 IN 字段填槽 → 得到“填槽后的 Prompt”
7. 调用大模型（一次请求）
8. 解析模型输出为 JSON，做 OUT 校验：
    - `event.type == "INIT"`
    - `ai_state.world_seed/title/tone/memory_summary/arc_progress` 存在
    - `arc_progress == 0`（INIT 规则）
    - `payload.mainline/opening/start_hint/options` 存在（至少保证“行动方向”存在）
    - `routing.next_event_type` ∈ {DECISION, COMBAT, PUZZLE, END}
9. 存储：
    - 保存 `session_id -> ai_state + 最近一次 OUT`（用于下一事件作为 last_ai_state）
10. 返回给前端：INIT.OUT 原样返回

---

如果你愿意，我下一步可以直接把这个“样例包”整理成一个 `INIT_Developer_Example.md` 文件让你下载（方便你直接发给开发者）。你一句话指令我就生成。





