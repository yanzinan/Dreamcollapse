# 样例1

> 普通解谜（不致死、不引敌）
>
> 👉 目标：
>
> - 正常 PUZZLE 流
> - routing 应该是 `puzzle` 或 `decision`

入参

```json
{
  "event": {
    "type": "puzzle"
  },
  "session": {
    "session_id": "sess_puzzle_test_001",
    "player_count": 1,
    "difficulty": "NORMAL"
  },
  "time": {
    "hard_limit_seconds": 300,
    "elapsed_active_seconds": 40,
    "remaining_seconds": 260
  },
  "seed": {
    "run_seed": "run_puzzle_test_001"
  },
  "constraints": {
    "language": "cn",
    "content_rating": "PG",
    "max_chars_scene": 220,
    "max_chars_option": 14,
    "forbidden_terms": ["骰子", "扑克", "点数", "规则"]
  },
  "slots": {
    "tone_bias": "紧张冒险",
    "theme_bias": "大山寻宝",
    "npc_bias": "山神"
  },
  "client_context": {
    "platform": "web",
    "locale": "zh-CN"
  },
  "payload": {
    "selected_option_id": 2
  },
  "context": {
    "current_scene_summary": "你站在一扇刻满符文的石门前，三枚铜环可以旋转。",
    "available_options": [
      { "id": 1, "text": "转动左侧铜环到乌鸦符号" },
      { "id": 2, "text": "转动中间铜环到火焰符号" },
      { "id": 3, "text": "按下门中央的凹槽" }
    ],
    "state_flags": {}
  }
}
```

出参

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "event": {
            "type": "puzzle"
        },
        "ai_state": {
            "world_seed": "run_puzzle_test_001",
            "title": "山神试炼",
            "tone": "紧张冒险",
            "memory_summary": "探险者来到一处古老的山神遗迹，试图打开一扇刻有符文的石门。",
            "arc_progress": 15
        },
        "payload": {
            "puzzle": {
                "title": "三环石门",
                "riddle": "石门上的符文描绘着‘乌鸦衔火，火融寒冰，冰封大地’。三枚铜环分别对应乌鸦、火焰、寒冰符号。",
                "hint_level": 0,
                "key_fact": "必须按照‘乌鸦衔火，火融寒冰’的顺序激活符号，即先乌鸦，后火焰。"
            },
            "attempt": {
                "selected_option_id": 2,
                "selected_option_text": "转动中间铜环到火焰符号",
                "is_correct": false
            },
            "result": {
                "outcome": "错误的顺序",
                "consequence": "你转动了中间的火焰铜环。石门上的符文骤然亮起红光，一股灼热的气流从门缝中喷出，烫伤了你的手臂。同时，门两侧的石壁传来沉闷的摩擦声。",
                "failure_level": "minor",
                "enemy_triggered": false
            },
            "scene": {
                "summary": "石门符文红光渐弱，但灼热感仍在。两侧石壁的摩擦声停止，似乎有东西被激活了。门上的乌鸦和寒冰符号依然黯淡。",
                "npc_line": "（低沉的山神回响在石室中回响）‘顺序，即是法则。’"
            },
            "options": [
                {
                    "id": 1,
                    "text": "转动左侧乌鸦铜环"
                },
                {
                    "id": 3,
                    "text": "按下门中央凹槽"
                },
                {
                    "id": 4,
                    "text": "检查两侧石壁"
                }
            ]
        },
        "routing": {
            "next_event_type": "puzzle",
            "should_end": false
        },
        "context": {
            "current_scene_summary": "石门符文红光渐弱，两侧石壁有异响，乌鸦和寒冰符号未激活。",
            "available_options": [
                {
                    "id": 1,
                    "text": "转动左侧乌鸦铜环"
                },
                {
                    "id": 3,
                    "text": "按下门中央凹槽"
                },
                {
                    "id": 4,
                    "text": "检查两侧石壁"
                }
            ],
            "state_flags": {
                "fire_ring_activated": true,
                "arm_injured": true
            }
        },
        "meta": {
            "trace_id": "puzzle_001_attempt_2"
        }
    }
}
```

# 样例2

> 错误 → 致死（必须 END）
>
> 👉 目标：
>
> - 强制触发 `deadly`
> - handler 必须压成：

入参

```json
{
  "event": {
    "type": "puzzle"
  },
  "session": {
    "session_id": "sess_puzzle_test_death",
    "player_count": 1,
    "difficulty": "NORMAL"
  },
  "time": {
    "hard_limit_seconds": 300,
    "elapsed_active_seconds": 90,
    "remaining_seconds": 210
  },
  "seed": {
    "run_seed": "run_puzzle_test_death"
  },
  "constraints": {
    "language": "cn",
    "content_rating": "PG",
    "max_chars_scene": 220,
    "max_chars_option": 14,
    "forbidden_terms": ["骰子", "扑克", "点数", "规则"]
  },
  "slots": {
    "tone_bias": "紧张冒险",
    "theme_bias": "大山寻宝",
    "npc_bias": "山神"
  },
  "client_context": {
    "platform": "web",
    "locale": "zh-CN"
  },
  "payload": {
    "selected_option_id": 3
  },
  "context": {
    "current_scene_summary": "石门旁的地面布满裂纹，隐约有机关的痕迹。",
    "available_options": [
      { "id": 1, "text": "轻轻触碰左侧石砖" },
      { "id": 2, "text": "观察裂纹分布" },
      { "id": 3, "text": "用力踩踏中央地面" }
    ],
    "state_flags": {}
  }
}
```

出参

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "event": {
            "type": "puzzle"
        },
        "ai_state": {
            "world_seed": "run_puzzle_test_death",
            "title": "山神试炼",
            "tone": "紧张冒险",
            "memory_summary": "玩家在山中寻找宝藏，来到一处布满裂纹的石门前。",
            "arc_progress": 25
        },
        "payload": {
            "puzzle": {
                "title": "裂纹石门",
                "riddle": "石门前的裂纹看似杂乱，实则暗藏开启的规律。裂纹的深浅与方向似乎对应着某种顺序。",
                "hint_level": 0,
                "key_fact": "裂纹最浅、方向最平缓的石砖才是安全的触发点，用力踩踏中央会触发陷阱。"
            },
            "attempt": {
                "selected_option_id": 3,
                "selected_option_text": "用力踩踏中央地面",
                "is_correct": false
            },
            "result": {
                "outcome": "触发致命陷阱",
                "consequence": "你用力踩下，中央地面瞬间塌陷，你坠入布满尖刺的深坑，当场毙命。",
                "failure_level": "deadly",
                "enemy_triggered": false
            },
            "scene": {
                "summary": "地面塌陷，你坠入深坑，尖刺贯穿了身体。山神的试炼以失败告终。",
                "npc_line": "（山神低语）鲁莽的代价，即是死亡。"
            },
            "options": [
                {
                    "id": 1,
                    "text": "轻轻触碰左侧石砖"
                },
                {
                    "id": 2,
                    "text": "观察裂纹分布"
                },
                {
                    "id": 3,
                    "text": "用力踩踏中央地面"
                }
            ]
        },
        "routing": {
            "next_event_type": "end",
            "should_end": true
        },
        "context": {
            "current_scene_summary": "地面塌陷，你坠入深坑，尖刺贯穿了身体。山神的试炼以失败告终。",
            "available_options": [
                {
                    "id": 1,
                    "text": "轻轻触碰左侧石砖"
                },
                {
                    "id": 2,
                    "text": "观察裂纹分布"
                },
                {
                    "id": 3,
                    "text": "用力踩踏中央地面"
                }
            ],
            "state_flags": {}
        },
        "meta": {
            "trace_id": "puzzle_death_001"
        }
    }
}
```

# 样例3

> 错误 → 引敌（必须 COMBAT）
>
> 👉 目标：
>
> - 强制触发 `enemy_triggered = true`
> - handler 必须压成：

入参

```json
{
  "event": {
    "type": "puzzle"
  },
  "session": {
    "session_id": "sess_puzzle_test_combat",
    "player_count": 1,
    "difficulty": "NORMAL"
  },
  "time": {
    "hard_limit_seconds": 300,
    "elapsed_active_seconds": 70,
    "remaining_seconds": 230
  },
  "seed": {
    "run_seed": "run_puzzle_test_combat"
  },
  "constraints": {
    "language": "cn",
    "content_rating": "PG",
    "max_chars_scene": 220,
    "max_chars_option": 14,
    "forbidden_terms": ["骰子", "扑克", "点数", "规则"]
  },
  "slots": {
    "tone_bias": "紧张冒险",
    "theme_bias": "大山寻宝",
    "npc_bias": "山神"
  },
  "client_context": {
    "platform": "web",
    "locale": "zh-CN"
  },
  "payload": {
    "selected_option_id": 1
  },
  "context": {
    "current_scene_summary": "祭坛中央插着一把短刃，周围刻满古老符文。",
    "available_options": [
      { "id": 1, "text": "直接拔出祭坛中央短刃" },
      { "id": 2, "text": "检查符文排列顺序" },
      { "id": 3, "text": "轻触短刃周围凹槽" }
    ],
    "state_flags": {}
  }
}
```

出参

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "event": {
            "type": "puzzle"
        },
        "ai_state": {
            "world_seed": "run_puzzle_test_combat",
            "title": "山神祭坛",
            "tone": "紧张冒险",
            "memory_summary": "玩家在古老的山神祭坛前，试图直接拔出中央的短刃，触发了守护机制。",
            "arc_progress": 15
        },
        "payload": {
            "puzzle": {
                "title": "山神祭坛的封印",
                "riddle": "祭坛中央的短刃是封印核心，周围符文构成能量回路。强行拔出会破坏回路平衡，引发守护者苏醒。正确的解法是先解读符文顺序，切断能量供应。",
                "hint_level": 0,
                "key_fact": "符文排列顺序暗示了能量流动的路径，必须先切断源头。"
            },
            "attempt": {
                "selected_option_id": 1,
                "selected_option_text": "直接拔出祭坛中央短刃",
                "is_correct": false
            },
            "result": {
                "outcome": "鲁莽之举",
                "consequence": "你用力握住短刃，猛地将其拔出！祭坛剧烈震动，所有符文瞬间黯淡，随即爆发出刺目的红光。短刃离位的瞬间，能量回路被暴力切断，反冲的能量激活了沉睡的守护者。",
                "failure_level": "major",
                "enemy_triggered": true
            },
            "scene": {
                "summary": "祭坛红光闪烁，地面裂开，两尊巨大的山岩守卫从裂缝中升起，它们空洞的眼窝锁定了你，沉重的石拳紧握。",
                "npc_line": "（山神低沉的意念在洞穴中回荡）亵渎封印者……当受山石之刑。"
            },
            "options": [
                {
                    "id": 1,
                    "text": "持刃迎战守卫"
                },
                {
                    "id": 2,
                    "text": "寻找祭坛弱点"
                },
                {
                    "id": 3,
                    "text": "向侧方甬道撤退"
                }
            ]
        },
        "routing": {
            "next_event_type": "combat",
            "should_end": false
        },
        "context": {
            "current_scene_summary": "祭坛红光闪烁，地面裂开，两尊巨大的山岩守卫从裂缝中升起，它们空洞的眼窝锁定了你，沉重的石拳紧握。",
            "available_options": [
                {
                    "id": 1,
                    "text": "持刃迎战守卫"
                },
                {
                    "id": 2,
                    "text": "寻找祭坛弱点"
                },
                {
                    "id": 3,
                    "text": "向侧方甬道撤退"
                }
            ],
            "state_flags": {
                "guardians_awakened": true,
                "ritual_dagger_removed": true
            }
        },
        "meta": {
            "trace_id": "puzzle_combat_trigger_001"
        }
    }
}
```

