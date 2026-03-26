# 样例1

> 这个和样例3相似，但是这个入参，是我可以让他输出end测的，样例2是llm返回的end，有点不一样
>
> 该入参中玩家初始已处于 **极低血量（player_hp = 1）** 且仍在高风险对抗中，一旦本回合结算造成伤害使 `player_hp ≤ 0`，系统必须根据硬约束：
>
> > 玩家死亡 → 强制终局
>
> 因此无论 options 或剧情如何延展，routing 都必须输出：
>
> - `next_event_type = "end"`
> - `should_end = true`
>
> 这是一个**优先级最高的强规则（override all routing logic）**，用于保证事件链不会在非法状态（死亡后仍继续）下运行。

入参

```json
{
  "event": {
    "type": "combat"
  },
  "session": {
    "session_id": "sess_test_death_001",
    "player_count": 1,
    "difficulty": "NORMAL"
  },
  "time": {
    "hard_limit_seconds": 300,
    "elapsed_active_seconds": 95,
    "remaining_seconds": 205
  },
  "seed": {
    "run_seed": "run_test_death_001"
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
    "locale": "en-US"
  },
  "payload": {
    "selected_option_id": 4,
    "selected_option_text": "挥刀强攻",
    "enemy_name": "守印石妖",
    "enemy_hp": 3,
    "player_hp": 1,
    "round": 3
  },
  "context": {
    "current_scene_summary": "你已被石妖逼到石台边缘，脚下碎石滑落，符文的光芒越来越不稳定。",
    "available_options": [
      {
        "id": 4,
        "text": "挥刀强攻"
      },
      {
        "id": 5,
        "text": "侧身闪避"
      },
      {
        "id": 6,
        "text": "借藤蔓后撤"
      }
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
            "type": "combat"
        },
        "ai_state": {
            "world_seed": "run_test_death_001",
            "title": "山神印记",
            "tone": "紧张冒险",
            "memory_summary": "寻宝者深入大山，在古老祭坛遭遇了守护符文的石妖，被逼至石台边缘。",
            "arc_progress": 35
        },
        "payload": {
            "combat": {
                "enemy_name": "守印石妖",
                "enemy_hp": 1,
                "player_hp": 0,
                "round": 4,
                "battle_status": "defeat"
            },
            "result": {
                "player_action": "挥刀强攻",
                "enemy_action": "石拳重击",
                "outcome": "你孤注一掷，挥刀砍向石妖，刀刃在其石臂上崩出火花，造成了一些裂痕。但石妖无视了你的攻击，巨大的石拳带着千钧之力砸下，正中你的胸口。",
                "damage_to_enemy": 2,
                "damage_to_player": 1
            },
            "scene": {
                "summary": "石拳的冲击力将你击飞，你感到肋骨断裂，视野模糊。身体从石台边缘坠落，符文的光芒在你眼中迅速远去，耳边只剩下呼啸的风声和石妖低沉的轰鸣。"
            },
            "options": [
                {
                    "id": 7,
                    "text": "接受结局"
                },
                {
                    "id": 8,
                    "text": "回顾过往"
                }
            ]
        },
        "routing": {
            "next_event_type": "end",
            "should_end": true
        },
        "context": {
            "current_scene_summary": "被石妖重击后从石台坠落，生命垂危。",
            "available_options": [
                {
                    "id": 7,
                    "text": "接受结局"
                },
                {
                    "id": 8,
                    "text": "回顾过往"
                }
            ],
            "state_flags": {}
        },
        "meta": {
            "trace_id": "combat_round_4_defeat"
        }
    }
}
```

# 样例2

> 当前回合后，战斗仍处于 **ongoing 状态**，敌人仍具威胁，且下一步 options（攻击弱点 / 周旋 / 应对）本质上都是围绕“如何继续对抗敌人”展开，核心玩法仍是战斗闭环中的策略选择，而非独立机制破解或战后处理，因此 routing 应继续保持为 `combat`。

入参

```json
{
  "event": {
    "type": "combat"
  },
  "session": {
    "session_id": "sess_test_001",
    "player_count": 1,
    "difficulty": "NORMAL"
  },
  "time": {
    "hard_limit_seconds": 300,
    "elapsed_active_seconds": 40,
    "remaining_seconds": 260
  },
  "seed": {
    "run_seed": "run_test_001"
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
    "locale": "en-US"
  },
  "payload": {
    "selected_option_id": 4,
    "selected_option_text": "寻找藤蔓攀爬",
    "enemy_name": "守印石妖",
    "enemy_hp": 12,
    "player_hp": 10,
    "round": 1
  },
  "context": {
    "current_scene_summary": "玩家试图借藤蔓下到悬崖石台，但石台边缘的符文惊动了守护此地的石妖。",
    "available_options": [
      {
        "id": 4,
        "text": "寻找藤蔓攀爬"
      },
      {
        "id": 5,
        "text": "观察符文含义"
      },
      {
        "id": 6,
        "text": "询问山神提示"
      }
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
            "type": "combat"
        },
        "ai_state": {
            "world_seed": "run_test_001",
            "title": "山神印记的试炼",
            "tone": "紧张冒险",
            "memory_summary": "玩家在悬崖边惊动了守护符文的石妖，试图借助藤蔓攀爬来应对。",
            "arc_progress": 15
        },
        "payload": {
            "combat": {
                "enemy_name": "守印石妖",
                "enemy_hp": 12,
                "player_hp": 8,
                "round": 2,
                "battle_status": "ongoing"
            },
            "result": {
                "player_action": "寻找藤蔓攀爬",
                "enemy_action": "挥动岩石手臂猛砸",
                "outcome": "你抓住一根粗壮的藤蔓试图攀爬，但石妖的巨臂砸在岩壁上，震落的碎石击中了你的肩膀。",
                "damage_to_enemy": 0,
                "damage_to_player": 2
            },
            "scene": {
                "summary": "碎石飞溅，你忍着疼痛挂在藤蔓上。石妖堵在石台边缘，身上的符文微微发光，似乎在汲取大地的力量。战斗仍在继续。"
            },
            "options": [
                {
                    "id": 7,
                    "text": "荡向侧面攻击"
                },
                {
                    "id": 8,
                    "text": "观察符文弱点"
                },
                {
                    "id": 9,
                    "text": "尝试与山神沟通"
                }
            ]
        },
        "routing": {
            "next_event_type": "combat",
            "should_end": false
        },
        "context": {
            "current_scene_summary": "你挂在藤蔓上，石妖堵在石台边缘，符文发光，战斗未歇。",
            "available_options": [
                {
                    "id": 7,
                    "text": "荡向侧面攻击"
                },
                {
                    "id": 8,
                    "text": "观察符文弱点"
                },
                {
                    "id": 9,
                    "text": "尝试与山神沟通"
                }
            ],
            "state_flags": {}
        },
        "meta": {
            "trace_id": "combat_round2_run_test_001"
        }
    }
}
```

# 样例3

> 本回合结算后 **player_hp 已降至 0**，根据系统硬规则（hp ≤ 0 强制终局），战斗状态为 `defeat`，不再允许进入后续事件链路（combat / decision / puzzle），因此 routing 必须输出 `end`，且 `should_end = true`，用于进入终局收束。

入参

```json
{
  "event": {
    "type": "combat"
  },
  "session": {
    "session_id": "sess_test_002",
    "player_count": 1,
    "difficulty": "NORMAL"
  },
  "time": {
    "hard_limit_seconds": 300,
    "elapsed_active_seconds": 95,
    "remaining_seconds": 205
  },
  "seed": {
    "run_seed": "run_test_002"
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
    "locale": "en-US"
  },
  "payload": {
    "selected_option_id": 4,
    "selected_option_text": "挥刀强攻",
    "enemy_name": "守印石妖",
    "enemy_hp": 3,
    "player_hp": 1,
    "round": 3
  },
  "context": {
    "current_scene_summary": "你已被石妖逼到石台边缘，脚下碎石滑落，符文的光芒越来越不稳定。",
    "available_options": [
      {
        "id": 4,
        "text": "挥刀强攻"
      },
      {
        "id": 5,
        "text": "侧身闪避"
      },
      {
        "id": 6,
        "text": "借藤蔓后撤"
      }
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
            "type": "combat"
        },
        "ai_state": {
            "world_seed": "run_test_002",
            "title": "山神印记",
            "tone": "紧张冒险",
            "memory_summary": "寻宝者深入大山，在古老祭坛遭遇守护符文的山神石妖，被逼至石台边缘。",
            "arc_progress": 35
        },
        "payload": {
            "combat": {
                "enemy_name": "守印石妖",
                "enemy_hp": 1,
                "player_hp": 0,
                "round": 4,
                "battle_status": "defeat"
            },
            "result": {
                "player_action": "挥刀强攻",
                "enemy_action": "石拳重击",
                "outcome": "你孤注一掷，挥刀猛砍在石妖胸口，碎石飞溅。但石妖的重拳也同时砸中了你，你被击飞，坠下石台。",
                "damage_to_enemy": 2,
                "damage_to_player": 1
            },
            "scene": {
                "summary": "你从石台边缘坠落，符文的光芒在头顶迅速黯淡。石妖的身影在崖边俯视，随后转身隐入黑暗。剧痛与失重感袭来，意识逐渐模糊。"
            },
            "options": [
                {
                    "id": 7,
                    "text": "挣扎起身"
                },
                {
                    "id": 8,
                    "text": "检查伤势"
                }
            ]
        },
        "routing": {
            "next_event_type": "end",
            "should_end": true
        },
        "context": {
            "current_scene_summary": "你从石台边缘坠落，符文光芒黯淡，石妖消失，意识模糊。",
            "available_options": [
                {
                    "id": 7,
                    "text": "挣扎起身"
                },
                {
                    "id": 8,
                    "text": "检查伤势"
                }
            ],
            "state_flags": {}
        },
        "meta": {
            "trace_id": "combat_round_4_defeat"
        }
    }
}
```

# 样例4

> 虽然战斗仍为 **ongoing**，但当前场景已明确暴露“符文弱点 / 核心机制”，且下一步 options（解读符文 / 触发机制等）主要围绕“如何破解机制”展开，核心玩法已从“对抗敌人”转为“理解并触发规则”，因此 routing 应从 combat 转入 `puzzle`。

入参

```json
{
  "event": {
    "type": "combat"
  },
  "session": {
    "session_id": "sess_test_003",
    "player_count": 1,
    "difficulty": "NORMAL"
  },
  "time": {
    "hard_limit_seconds": 300,
    "elapsed_active_seconds": 70,
    "remaining_seconds": 230
  },
  "seed": {
    "run_seed": "run_test_003"
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
    "locale": "en-US"
  },
  "payload": {
    "selected_option_id": 5,
    "selected_option_text": "观察符文含义",
    "enemy_name": "守印石妖",
    "enemy_hp": 8,
    "player_hp": 9,
    "round": 2
  },
  "context": {
    "current_scene_summary": "石妖的动作因符文闪烁而短暂停滞，你意识到也许破解石台上的纹路，比继续硬拼更关键。",
    "available_options": [
      {
        "id": 5,
        "text": "观察符文含义"
      },
      {
        "id": 6,
        "text": "询问山神提示"
      },
      {
        "id": 7,
        "text": "检查石台裂缝"
      }
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
            "type": "combat"
        },
        "ai_state": {
            "world_seed": "run_test_003",
            "title": "山神印记",
            "tone": "紧张冒险",
            "memory_summary": "玩家在古祭坛与守印石妖对峙，发现石台上的符文能影响石妖的行动。",
            "arc_progress": 25
        },
        "payload": {
            "combat": {
                "enemy_name": "守印石妖",
                "enemy_hp": 8,
                "player_hp": 9,
                "round": 3,
                "battle_status": "ongoing"
            },
            "result": {
                "player_action": "观察符文含义",
                "enemy_action": "石妖趁你分神，挥动沉重的石臂砸来",
                "outcome": "你快速解读出符文代表‘束缚’，但闪避不及，被石臂擦伤。",
                "damage_to_enemy": 0,
                "damage_to_player": 1
            },
            "scene": {
                "summary": "你瞥见石台上发光的符文，其含义是‘束缚’。石妖的攻击因此略显迟缓，但并未停止。你受了点轻伤，但破解符文似乎是对付它的关键。"
            },
            "options": [
                {
                    "id": 8,
                    "text": "尝试激活符文"
                },
                {
                    "id": 9,
                    "text": "攻击石妖弱点"
                },
                {
                    "id": 10,
                    "text": "寻找山神印记"
                }
            ]
        },
        "routing": {
            "next_event_type": "puzzle",
            "should_end": false
        },
        "context": {
            "current_scene_summary": "你解读出‘束缚’符文，石妖攻击因此迟缓，但战斗仍在继续。",
            "available_options": [
                {
                    "id": 8,
                    "text": "尝试激活符文"
                },
                {
                    "id": 9,
                    "text": "攻击石妖弱点"
                },
                {
                    "id": 10,
                    "text": "寻找山神印记"
                }
            ],
            "state_flags": {}
        },
        "meta": {
            "trace_id": "combat_round3_run_test_003"
        }
    }
}
```

