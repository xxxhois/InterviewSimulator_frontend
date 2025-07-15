## 题目管理

### 3. 获取题目列表

```HTTP
GET /test/problems/
```

 **查询参数** :

* `page`: 页码 (默认: 1)
* `size`: 每页数量 (默认: 10)
* `difficulty`: 难度 (easy/medium/hard)
* `category`: 分类 (algorithm/data-structure/system-design)

 **响应** :

```JSON
{
  "success": true,
  "data": {
    "problems": [
      {
        "id": 1,
        "title": "两数之和",
        "difficulty": "easy",
        "category": "algorithm",
        "description": "给定一个整数数组...",
        "constraints": [
          "2 <= nums.length <= 104",
          "-109 <= nums[i] <= 109"
        ],
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "size": 10
  }
}
```

### 4. 获取题目详情

```HTTP
GET /problems/{problem_id}/
```

 **响应** :

```JSON
{
  "success": true,
  "data": {
    "id": 1,
    "title": "两数之和",
    "difficulty": "easy",
    "category": "algorithm",
    "description": "给定一个整数数组 nums 和一个整数目标值 target...",
    "constraints": [
      "2 <= nums.length <= 104",
      "-109 <= nums[i] <= 109",
      "-109 <= target <= 109",
      "只会存在一个有效答案"
    ],
    "examples": [
      {
        "input": "[2,7,11,15]\n9",
        "output": "[0,1]",
        "explanation": "因为 nums[0] + nums[1] == 9 ，返回 [0, 1]"
      }
    ],
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

## 代码执行

### 5. 运行代码

```HTTP
POST /code/run-code/
```

 **请求头** :

```Plain
Authorization: Bearer <token>
```

 **请求体** :

```JSON
{
  "source_code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << \"Hello, World!\" << endl;\n    return 0;\n}",
  "language_id": 54,
  "stdin": "test input"
}
```

 **响应** :

```JSON
{
  "success": true,
  "data": {
    "stdout": "Hello, World!\n",
    "stderr": "",
    "compile_output": "",
    "execution_time": 0.123,
    "memory_usage": 1024,
    "status": {
      "id": 3,
      "description": "Accepted"
    }
  }
}
```

### 6. 获取支持的语言列表

```HTTP
GET /code/languages/
```

 **响应** :

```JSON
{
  "success": true,
  "data": [
    {
      "id": 54,
      "name": "C++ (GCC 9.2.0)",
      "monaco_lang": "cpp"
    },
    {
      "id": 62,
      "name": "Java (OpenJDK 13.0.1)",
      "monaco_lang": "java"
    },
    {
      "id": 71,
      "name": "Python (3.8.1)",
      "monaco_lang": "python"
    },
    {
      "id": 63,
      "name": "JavaScript (Node.js 12.14.0)",
      "monaco_lang": "javascript"
    }
  ]
}
```

## 测试用例管理

### 7. 获取题目的测试用例

```HTTP
GET /problems/{problem_id}/testcases/
```

 **响应** :

```JSON
{
  "success": true,
  "data": {
    "public": [
      {
        "id": 1,
        "name": "示例 1",
        "input": "[2,7,11,15]\n9",
        "expected_output": "[0,1]",
        "is_public": true
      },
      {
        "id": 2,
        "name": "示例 2",
        "input": "[3,2,4]\n6",
        "expected_output": "[1,2]",
        "is_public": true
      }
    ],
    "hidden": [
      {
        "id": 3,
        "name": "隐藏测试用例 1",
        "is_public": false
      },
      {
        "id": 4,
        "name": "隐藏测试用例 2",
        "is_public": false
      }
    ]
  }
}
```

### 8. 运行单个测试用例

```HTTP
POST /problems/{problem_id}/testcases/{testcase_id}/run/
```

 **请求体** :

```JSON
{
  "source_code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    // 用户代码\n    return 0;\n}",
  "language_id": 54
}
```

 **响应** :

```JSON
{
  "success": true,
  "data": {
    "passed": true,
    "actual_output": "[0,1]",
    "expected_output": "[0,1]",
    "error": "",
    "execution_time": 0.123,
    "memory_usage": 1024,
    "testcase": {
      "id": 1,
      "name": "示例 1",
      "is_public": true
    }
  }
}
```

### 9. 运行所有公开测试用例

```HTTP
POST /problems/{problem_id}/testcases/run-public/
```

 **请求体** :

```JSON
{
  "source_code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    // 用户代码\n    return 0;\n}",
  "language_id": 54
}
```

 **响应** :

```JSON
{
  "success": true,
  "data": {
    "results": [
      {
        "testcase_id": 1,
        "passed": true,
        "actual_output": "[0,1]",
        "expected_output": "[0,1]",
        "error": "",
        "execution_time": 0.123
      },
      {
        "testcase_id": 2,
        "passed": true,
        "actual_output": "[1,2]",
        "expected_output": "[1,2]",
        "error": "",
        "execution_time": 0.145
      }
    ],
    "summary": {
      "total": 2,
      "passed": 2,
      "failed": 0,
      "success_rate": 100.0
    }
  }
}
```

### 10. 提交最终答案

```HTTP
POST /problems/{problem_id}/submit/
```

 **请求体** :

```JSON
{
  "source_code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    // 用户最终代码\n    return 0;\n}",
  "language_id": 54
}
```

 **响应** :

```JSON
{
  "success": true,
  "data": {
    "submission_id": 123,
    "hidden_results": {
      "total": 5,
      "passed": 4,
      "failed": 1,
      "passed_ids": [1, 2, 3, 4],
      "failed_ids": [5]
    },
    "overall_score": 80.0,
    "status": "completed"
  }
}
```
