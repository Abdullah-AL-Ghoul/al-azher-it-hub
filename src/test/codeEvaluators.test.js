import { describe, it, expect } from 'vitest'
import {
  parseTestCaseInput,
  evaluateArenaChallenge,
  executePythonCode,
  executeSqlQuery,
  executeCppCode,
} from '../utils/codeEvaluators'

describe('CSP-Safe Code Evaluators Suite', () => {
  describe('parseTestCaseInput', () => {
    it('parses primitives and numbers cleanly without eval', () => {
      expect(parseTestCaseInput('5, 10')).toEqual([5, 10])
      expect(parseTestCaseInput('"al-azher"')).toEqual(['al-azher'])
      expect(parseTestCaseInput('true, false')).toEqual([true, false])
    })

    it('parses arrays and nested arrays', () => {
      expect(parseTestCaseInput('[-1, 0, 3, 5, 9, 12], 9')).toEqual([
        [-1, 0, 3, 5, 9, 12],
        9,
      ])
      expect(parseTestCaseInput('[[1, 3], [2, 6]]')).toEqual([
        [
          [1, 3],
          [2, 6],
        ],
      ])
    })

    it('handles empty input gracefully', () => {
      expect(parseTestCaseInput('')).toEqual([])
      expect(parseTestCaseInput(null)).toEqual([])
    })
  })

  describe('evaluateArenaChallenge (Strict CSP-compliant runner for CodingArena)', () => {
    it('evaluates basic math and addition functions', () => {
      const code = `
        function sum(a, b) {
          return a + b;
        }
      `
      expect(evaluateArenaChallenge(code, '15, 27')).toBe(42)
    })

    it('evaluates Challenge 1: reverseString using standard loop', () => {
      const code = `
        function reverseString(str) {
          let reversed = "";
          for (let i = str.length - 1; i >= 0; i--) {
            reversed += str[i];
          }
          return reversed;
        }
      `
      expect(evaluateArenaChallenge(code, '"alazher"')).toBe('rehzala')
      expect(evaluateArenaChallenge(code, '"algorithm"')).toBe('mhtirogla')
      expect(evaluateArenaChallenge(code, '"it"')).toBe('ti')
    })

    it('evaluates Challenge 2: findMissingNumber using formula and reduce', () => {
      const code = `
        function findMissingNumber(nums) {
          const n = nums.length;
          const expectedSum = (n * (n + 1)) / 2;
          const actualSum = nums.reduce((acc, curr) => acc + curr, 0);
          return expectedSum - actualSum;
        }
      `
      expect(evaluateArenaChallenge(code, '[3, 0, 1]')).toBe(2)
      expect(evaluateArenaChallenge(code, '[0, 1]')).toBe(2)
      expect(evaluateArenaChallenge(code, '[9,6,4,2,3,5,7,0,1]')).toBe(8)
    })

    it('evaluates Challenge 3: isValidParentheses using stack and map', () => {
      const code = `
        function isValidParentheses(s) {
          const stack = [];
          const map = { ')': '(', '}': '{', ']': '[' };
          for (let char of s) {
            if (char === '(' || char === '{' || char === '[') {
              stack.push(char);
            } else {
              if (stack.pop() !== map[char]) return false;
            }
          }
          return stack.length === 0;
        }
      `
      expect(evaluateArenaChallenge(code, '"()[]{}"')).toBe(true)
      expect(evaluateArenaChallenge(code, '"(]"')).toBe(false)
      expect(evaluateArenaChallenge(code, '"([{}])"')).toBe(true)
    })

    it('evaluates Challenge 4: binarySearch with logarithmic index lookup', () => {
      const code = `
        function binarySearch(nums, target) {
          let left = 0;
          let right = nums.length - 1;
          while (left <= right) {
            let mid = Math.floor((left + right) / 2);
            if (nums[mid] === target) return mid;
            if (nums[mid] < target) {
              left = mid + 1;
            } else {
              right = mid - 1;
            }
          }
          return -1;
        }
      `
      expect(evaluateArenaChallenge(code, '[-1,0,3,5,9,12], 9')).toBe(4)
      expect(evaluateArenaChallenge(code, '[-1,0,3,5,9,12], 2')).toBe(-1)
      expect(evaluateArenaChallenge(code, '[5], 5')).toBe(0)
    })

    it('evaluates Challenge 5: maxSubArray with Kadane algorithm', () => {
      const code = `
        function maxSubArray(nums) {
          let maxSoFar = nums[0];
          let currentMax = nums[0];
          for (let i = 1; i < nums.length; i++) {
            currentMax = Math.max(nums[i], currentMax + nums[i]);
            maxSoFar = Math.max(maxSoFar, currentMax);
          }
          return maxSoFar;
        }
      `
      expect(evaluateArenaChallenge(code, '[-2,1,-3,4,-1,2,1,-5,4]')).toBe(6)
      expect(evaluateArenaChallenge(code, '[1]')).toBe(1)
      expect(evaluateArenaChallenge(code, '[5,4,-1,7,8]')).toBe(23)
    })

    it('evaluates iterative Fibonacci series calculation', () => {
      const code = `
        function fib(n) {
          if (n <= 1) return n;
          let a = 0;
          let b = 1;
          for (let i = 2; i <= n; i++) {
            let c = a + b;
            a = b;
            b = c;
          }
          return b;
        }
      `
      expect(evaluateArenaChallenge(code, '0')).toBe(0)
      expect(evaluateArenaChallenge(code, '1')).toBe(1)
      expect(evaluateArenaChallenge(code, '7')).toBe(13)
      expect(evaluateArenaChallenge(code, '10')).toBe(55)
    })

    it('throws descriptive error on malformed function declaration', () => {
      expect(() => evaluateArenaChallenge('const x = 5;', '1, 2')).toThrow(/SyntaxError/)
      expect(() => evaluateArenaChallenge('', '')).toThrow(/Empty function code/)
    })
  })

  describe('executePythonCode (Client-Side Python Engine)', () => {
    it('executes simple print statements and comments', () => {
      const code = `
# Academic Python test
print("Al-Azhar University")
print("Faculty of IT")
      `
      const out = executePythonCode(code)
      expect(out).toContain('Al-Azhar University')
      expect(out).toContain('Faculty of IT')
    })

    it('executes variables and arithmetic calculation', () => {
      const code = `
x = 12
y = 8
total = x + y
print("Total:", total)
      `
      const out = executePythonCode(code)
      expect(out).toContain('Total: 20')
    })

    it('executes loops and range iterations', () => {
      const code = `
for i in range(4):
    print("Step", i)
      `
      const out = executePythonCode(code)
      expect(out).toContain('Step 0')
      expect(out).toContain('Step 1')
      expect(out).toContain('Step 2')
      expect(out).toContain('Step 3')
    })

    it('supports Python f-strings formatting', () => {
      const code = `
student = "Abdullah"
gpa = 95.8
print(f"Student: {student} | GPA: {gpa}")
      `
      const out = executePythonCode(code)
      expect(out).toContain('Student: Abdullah | GPA: 95.8')
    })

    it('supports functions with return values', () => {
      const code = `
def multiply(a, b):
    return a * b

result = multiply(6, 7)
print("Result is", result)
      `
      const out = executePythonCode(code)
      expect(out).toContain('Result is 42')
    })
  })

  describe('executeSqlQuery (In-Memory Academic Relational Engine)', () => {
    it('executes SELECT * from students table', () => {
      const res = executeSqlQuery('SELECT * FROM students')
      expect(res.columns).toBeDefined()
      expect(res.columns).toContain('name')
      expect(res.rows.length).toBeGreaterThanOrEqual(5)
    })

    it('executes SELECT with specific columns and WHERE filter', () => {
      const res = executeSqlQuery('SELECT name, gpa FROM students WHERE gpa >= 90')
      expect(res.columns).toEqual(['name', 'gpa'])
      expect(res.rows.length).toBeGreaterThan(0)
      res.rows.forEach((row) => {
        const gpaVal = Number(row[1])
        expect(gpaVal).toBeGreaterThanOrEqual(90)
      })
    })

    it('executes ORDER BY and LIMIT', () => {
      const res = executeSqlQuery('SELECT name, gpa FROM students ORDER BY gpa DESC LIMIT 2')
      expect(res.rows.length).toBe(2)
      expect(Number(res.rows[0][1])).toBeGreaterThanOrEqual(Number(res.rows[1][1]))
    })

    it('rejects destructive non-SELECT statements for safety', () => {
      expect(() => executeSqlQuery('DROP TABLE students')).toThrow(/Only SELECT queries are supported/)
      expect(() => executeSqlQuery('DELETE FROM courses')).toThrow(/Only SELECT queries are supported/)
      expect(() => executeSqlQuery('INSERT INTO students VALUES (1, "x")')).toThrow(/Only SELECT queries are supported/)
    })
  })

  describe('executeCppCode (C++ Stream & Vector Evaluator)', () => {
    it('simulates std::cout output with endl', () => {
      const code = `
#include <iostream>
using namespace std;

int main() {
    cout << "Welcome to C++ Data Structures" << endl;
    return 0;
}
      `
      const out = executeCppCode(code)
      expect(out).toContain('Welcome to C++ Data Structures')
    })

    it('evaluates scalar variables and arithmetic in C++', () => {
      const code = `
int main() {
    int a = 15;
    int b = 25;
    int sum = a + b;
    cout << "Sum: " << sum << endl;
    return 0;
}
      `
      const out = executeCppCode(code)
      expect(out).toContain('Sum: 40')
    })

    it('evaluates vector sorting simulation with range-for loop', () => {
      const code = `
int main() {
    vector<int> arr = {5, 2, 8, 1};
    sort(arr.begin(), arr.end());
    for (int x : arr) {
        cout << x << " ";
    }
    return 0;
}
      `
      const out = executeCppCode(code)
      expect(out).toContain('1 2 5 8')
    })
  })
})
