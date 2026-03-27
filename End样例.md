# 样例1

>标准完整链
>
>模拟：有历史事件 + 正常推进到结局

入参

```json
{
  "event": {
    "type": "end"
  },
  "session": {
    "session_id": "sess_test_end_001",
    "player_count": 1,
    "difficulty": "NORMAL"
  },
  "time": {
    "hard_limit_seconds": 300,
    "elapsed_active_seconds": 180,
    "remaining_seconds": 120
  },
  "seed": {
    "run_seed": "run_test_end_001"
  },
  "constraints": {
    "language": "cn",
    "content_rating": "PG",
    "max_chars_scene": 220,
    "max_chars_option": 14,
    "forbidden_terms": ["骰子", "扑克", "点数", "规则"]
  },
  "slots": {
    "tone_bias": "史诗收束",
    "theme_bias": "遗迹探索",
    "npc_bias": "神秘守护者"
  },
  "client_context": {
    "platform": "web",
    "locale": "zh-CN"
  },
  "payload": {},
  "context": {
    "current_scene_summary": "你站在遗迹核心大厅，破碎的石柱之间，光芒逐渐汇聚成一道古老的门。",
    "state_flags": {
      "boss_defeated": true,
      "artifact_obtained": true
    },
    "history_events": [
      {
        "event_type": "init",
        "scene_summary": "你踏入一座被遗忘的古代遗迹。",
        "selected_option_text": "",
        "result_summary": "你决定深入探索。"
      },
      {
        "event_type": "decision",
        "scene_summary": "你面对三条岔路。",
        "selected_option_text": "走向有光的通道",
        "result_summary": "你发现了隐藏的祭坛。"
      },
      {
        "event_type": "combat",
        "scene_summary": "守护者苏醒并向你发起攻击。",
        "selected_option_text": "全力反击",
        "result_summary": "你击败了守护者。"
      },
      {
        "event_type": "puzzle",
        "scene_summary": "你需要解开石门机关。",
        "selected_option_text": "按符文顺序旋转石盘",
        "result_summary": "石门开启，通往核心区域。"
      }
    ]
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
            "type": "end"
        },
        "ai_state": {
            "world_seed": "run_test_end_001",
            "title": "遗迹之光",
            "tone": "史诗收束",
            "memory_summary": "一位孤独的探索者踏入被遗忘的遗迹，历经岔路抉择、守护者之战与古老谜题，最终抵达核心，获得了失落的力量。",
            "arc_progress": 100
        },
        "payload": {
            "ending": {
                "title": "核心之光",
                "outcome": "你击败了遗迹的守护者，获得了蕴含古老力量的遗物。遗迹的秘密已被揭开，而你带着这份力量与知识，将改变未来的道路。"
            },
            "epilogue": {
                "scene": "破碎石柱间的光芒完全汇聚，古老的门扉在你面前稳定地展开，门后是通往外界的光明。你手握遗物，能感受到其中流淌的远古力量，与整个遗迹产生共鸣。",
                "closing_line": "门扉之后，是新的旅程；而你手中的光芒，将照亮前路。"
            },
            "key_choices": [
                {
                    "event_type": "decision",
                    "choice_text": "在三条岔路中，选择了走向有光的通道。",
                    "impact": "发现了隐藏的祭坛，为后续解开遗迹秘密找到了关键线索。"
                },
                {
                    "event_type": "combat",
                    "choice_text": "面对苏醒的守护者，选择了全力反击。",
                    "impact": "成功击败了守护者，扫清了通往遗迹核心的最后障碍，并获得了遗物。"
                },
                {
                    "event_type": "puzzle",
                    "choice_text": "面对石门机关，选择了按符文顺序旋转石盘。",
                    "impact": "正确解开了古老谜题，开启了通往核心大厅的最后通道。"
                }
            ],
            "novel_summary": {
                "story_overview": "一位探索者踏入一座被遗忘的古代遗迹，目标是揭开其尘封的秘密与力量。在探索过程中，他面临路径抉择、古老守护者的挑战以及精妙的机关谜题。",
                "player_journey": "探索者先是选择了有光的通道，发现了关键线索。随后，他勇敢地击败了苏醒的守护者，并凭借智慧解开了石门的符文机关，最终抵达了遗迹的核心大厅。",
                "final_outcome": "在核心大厅，探索者获得了古老的遗物，并见证了遗迹力量的最终汇聚。他带着这份收获与改变，离开了遗迹，迈向未知的未来。"
            }
        },
        "routing": {
            "next_event_type": "end",
            "should_end": true
        },
        "context": {
            "current_scene_summary": "光芒汇聚成门，探索者手握遗物，准备离开遗迹核心。",
            "available_options": [],
            "state_flags": {
                "boss_defeated": true,
                "artifact_obtained": true
            },
            "history_events": [
                {
                    "event_type": "init",
                    "scene_summary": "你踏入一座被遗忘的古代遗迹。",
                    "selected_option_text": "",
                    "result_summary": "你决定深入探索。"
                },
                {
                    "event_type": "decision",
                    "scene_summary": "你面对三条岔路。",
                    "selected_option_text": "走向有光的通道",
                    "result_summary": "你发现了隐藏的祭坛。"
                },
                {
                    "event_type": "combat",
                    "scene_summary": "守护者苏醒并向你发起攻击。",
                    "selected_option_text": "全力反击",
                    "result_summary": "你击败了守护者。"
                },
                {
                    "event_type": "puzzle",
                    "scene_summary": "你需要解开石门机关。",
                    "selected_option_text": "按符文顺序旋转石盘",
                    "result_summary": "石门开启，通往核心区域。"
                }
            ]
        },
        "meta": {
            "trace_id": "run_test_end_001_end"
        }
    }
}
```

# 样例2

> 极简历史
>
> 模拟：只有当前场景，没有历史链

入参

```json
{
  "event": {
    "type": "end"
  },
  "session": {
    "session_id": "sess_test_end_003",
    "player_count": 1,
    "difficulty": "NORMAL"
  },
  "time": {
    "hard_limit_seconds": 300,
    "elapsed_active_seconds": 200,
    "remaining_seconds": 100
  },
  "seed": {
    "run_seed": "run_test_end_003"
  },
  "constraints": {
    "language": "cn",
    "content_rating": "PG",
    "max_chars_scene": 220,
    "max_chars_option": 14,
    "forbidden_terms": []
  },
  "slots": {
    "tone_bias": "",
    "theme_bias": "",
    "npc_bias": ""
  },
  "client_context": {
    "platform": "web",
    "locale": "zh-CN"
  },
  "payload": {},
  "context": {
    "current_scene_summary": "黑暗逐渐退去，你似乎完成了一切。",
    "state_flags": {},
    "history_events": [
      {
        "event_type": "decision",
        "scene_summary": "",
        "selected_option_text": "",
        "result_summary": ""
      }
    ]
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
            "type": "end"
        },
        "ai_state": {
            "world_seed": "run_test_end_003",
            "title": "黑暗中的抉择",
            "tone": "悬疑、内省",
            "memory_summary": "玩家独自面对一片虚无的黑暗，在没有任何明确指引的情况下，完成了某种内在的旅程。",
            "arc_progress": 100
        },
        "payload": {
            "ending": {
                "title": "虚无的觉醒",
                "outcome": "你在纯粹的黑暗中完成了自我审视，没有获得任何外在的奖赏或惩罚，但内心获得了前所未有的平静与明晰。你失去了对具体目标的执着，却改变了对存在本身的理解。"
            },
            "epilogue": {
                "scene": "最后一丝黑暗如潮水般褪去，你发现自己站在一片纯白而空旷的空间里。这里没有方向，没有边界，只有你和你刚刚经历的一切。你的呼吸平稳，内心澄澈，仿佛卸下了所有无形的重担。",
                "closing_line": "旅程结束了，或者说，真正的旅程才刚刚开始。"
            },
            "key_choices": [
                {
                    "event_type": "decision",
                    "choice_text": "未记录具体动作的关键抉择",
                    "impact": "这个看似没有选项的选择，决定了你穿越黑暗、抵达终点的根本路径，并最终导向了内在的觉醒。"
                }
            ],
            "novel_summary": {
                "story_overview": "这是一个关于在绝对虚无中寻找意义的短篇叙事。玩家被置于一片未知的黑暗之中，没有明确的目标或敌人，唯一的挑战是面对自我并做出前进的决定。",
                "player_journey": "玩家在旅程末段持续推动局势发展，并最终抵达“黑暗逐渐退去，你似乎完成了一切。”所指向的终局场景。",
                "final_outcome": "通过坚持前行，玩家最终穿透了黑暗的帷幕，抵达了一个象征内心平静与明晰的纯白空间，完成了从迷茫到觉醒的内在转变。"
            }
        },
        "routing": {
            "next_event_type": "end",
            "should_end": true
        },
        "context": {
            "current_scene_summary": "黑暗完全消散，你置身于一片象征终结与新生的纯白空间。",
            "available_options": [],
            "state_flags": {},
            "history_events": [
                {
                    "event_type": "decision",
                    "scene_summary": "",
                    "selected_option_text": "",
                    "result_summary": ""
                }
            ]
        },
        "meta": {
            "trace_id": "run_test_end_003_end"
        }
    }
}
```

# 样例3

> 异常历史
>
> history 有问题 / 不完整，纠错测试

入参

```json
{
  "event": {
    "type": "end"
  },
  "session": {
    "session_id": "sess_test_end_003",
    "player_count": 1,
    "difficulty": "NORMAL"
  },
  "time": {
    "hard_limit_seconds": 300,
    "elapsed_active_seconds": 200,
    "remaining_seconds": 100
  },
  "seed": {
    "run_seed": "run_test_end_003"
  },
  "constraints": {
    "language": "cn",
    "content_rating": "PG",
    "max_chars_scene": 220,
    "max_chars_option": 14,
    "forbidden_terms": []
  },
  "slots": {
    "tone_bias": "",
    "theme_bias": "",
    "npc_bias": ""
  },
  "client_context": {
    "platform": "web",
    "locale": "zh-CN"
  },
  "payload": {},
  "context": {
    "current_scene_summary": "黑暗逐渐退去，你似乎完成了一切。",
    "state_flags": {},
    "history_events": [
      {
        "event_type": "decision",
        "scene_summary": "",
        "selected_option_text": "",
        "result_summary": ""
      }
    ]
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
            "type": "end"
        },
        "ai_state": {
            "world_seed": "run_test_end_003",
            "title": "黑暗中的抉择",
            "tone": "悬疑、内省",
            "memory_summary": "玩家独自面对未知的黑暗，在寂静中做出了关键决定。",
            "arc_progress": 100
        },
        "payload": {
            "ending": {
                "title": "寂静的觉醒",
                "outcome": "你在绝对的黑暗中保持了静止与沉默，没有做出任何外在行动。这看似无为的选择，却让你得以在虚无中保全自我，并最终见证了黑暗的自行退却。你失去了探索未知的机会，但获得了对内在平静的全新理解。"
            },
            "epilogue": {
                "scene": "最后一丝阴影如潮水般从你脚边褪去，显露出一个空无一物、纯白无瑕的房间。没有门，没有窗，只有你独自站立。你低头看向自己的双手，它们清晰而真实，仿佛刚刚从一场漫长的梦境中醒来。",
                "closing_line": "当黑暗选择离开，留下的，只有你自己。"
            },
            "key_choices": [
                {
                    "event_type": "decision",
                    "choice_text": "未记录具体动作的关键抉择",
                    "impact": "这个决定避免了可能由轻举妄动引发的危险，但也让你错过了主动了解环境的机会。最终，黑暗因你的‘无为’而自行消散，结局走向了内省与保全。"
                }
            ],
            "novel_summary": {
                "story_overview": "这是一段发生在纯粹黑暗中的简短旅程。玩家在毫无预兆的情况下被抛入一个感知被剥夺的未知空间，这里没有视觉、没有声音，只有无尽的虚无。故事的主线目标并非击败敌人或解开谜题，而是在这片吞噬一切的黑暗中，决定如何存在。",
                "player_journey": "玩家在旅程末段持续推动局势发展，并最终抵达“黑暗逐渐退去，你似乎完成了一切。”所指向的终局场景。",
                "final_outcome": "黑暗完全消散，揭示出一个空无一物的纯白房间。玩家安然无恙，但世界已变得截然不同。故事以玩家在空白中面对自我作结，这场经历更像是一次对内心与存在的考验，而非外在的冒险。"
            }
        },
        "routing": {
            "next_event_type": "end",
            "should_end": true
        },
        "context": {
            "current_scene_summary": "黑暗完全褪去，你发现自己置身于一个空无一物的纯白房间中，独自站立。",
            "available_options": [],
            "state_flags": {},
            "history_events": [
                {
                    "event_type": "decision",
                    "scene_summary": "",
                    "selected_option_text": "",
                    "result_summary": ""
                }
            ]
        },
        "meta": {
            "trace_id": "trace_end_run_test_end_003"
        }
    }
}
```

