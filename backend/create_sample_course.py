#!/usr/bin/env python3
"""Script to create a comprehensive sample course with modules, lessons, quizzes, and assignments"""

import requests
import json
import os

API_URL = os.environ.get("API_URL", "https://skill-exchange-110.preview.emergentagent.com/api")

# Admin login
def get_admin_token():
    response = requests.post(f"{API_URL}/auth/login", json={
        "email": "admin@lumina.com",
        "password": "admin123"
    })
    data = response.json()
    return data.get("access_token")

def create_course(token, course_data):
    response = requests.post(
        f"{API_URL}/admin/courses",
        json=course_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    return response.json()

def create_module(token, course_id, module_data):
    response = requests.post(
        f"{API_URL}/admin/courses/{course_id}/modules",
        json=module_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    return response.json()

def create_lesson(token, module_id, lesson_data):
    response = requests.post(
        f"{API_URL}/admin/modules/{module_id}/lessons",
        json=lesson_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    return response.json()

def create_quiz(token, module_id, quiz_data):
    response = requests.post(
        f"{API_URL}/admin/modules/{module_id}/quiz",
        json=quiz_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    return response.json()

def add_question(token, quiz_id, question_data):
    response = requests.post(
        f"{API_URL}/admin/quizzes/{quiz_id}/questions",
        json=question_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    return response.json()

def create_assignment(token, assignment_data):
    response = requests.post(
        f"{API_URL}/admin/assignments",
        json=assignment_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    return response.json()

def main():
    print("Getting admin token...")
    token = get_admin_token()
    if not token:
        print("Failed to get admin token!")
        return
    print(f"Token acquired: {token[:20]}...")

    # Create the comprehensive course
    print("\n=== Creating Full-Stack Web Development Course ===")
    course_result = create_course(token, {
        "title": "Complete Full-Stack Web Development Bootcamp",
        "short_description": "Master modern web development with React, Node.js, and MongoDB",
        "description": """This comprehensive bootcamp takes you from zero to full-stack developer. You'll learn:

• Frontend development with React 19 and TypeScript
• Backend development with Node.js and Express
• Database management with MongoDB
• Authentication and security best practices
• Deployment and DevOps fundamentals

By the end of this course, you'll be able to build and deploy production-ready web applications.""",
        "price": 199.99,
        "discount_price": 99.99,
        "category": "Development",
        "level": "beginner",
        "thumbnail_url": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800",
        "is_published": True
    })
    
    course_id = course_result.get("course_id")
    print(f"Course created: {course_id}")

    # Module 1: Introduction & Setup
    print("\n--- Module 1: Introduction & Setup ---")
    module1 = create_module(token, course_id, {
        "title": "Introduction & Environment Setup",
        "description": "Get your development environment ready and learn the fundamentals",
        "order": 1
    })
    module1_id = module1.get("module_id")
    print(f"Module 1 created: {module1_id}")

    # Module 1 Lessons
    lessons_m1 = [
        {"title": "Welcome to the Course", "description": "Course overview and what you'll learn", "content_type": "video", "duration_minutes": 5, "order": 1, "is_preview": True},
        {"title": "Installing Node.js and npm", "description": "Step-by-step guide to installing Node.js", "content_type": "text", "content": """# Installing Node.js

1. Visit nodejs.org
2. Download the LTS version for your operating system
3. Run the installer
4. Verify installation:
```bash
node --version
npm --version
```

You should see version numbers for both commands.""", "duration_minutes": 10, "order": 2},
        {"title": "Setting Up VS Code", "description": "Configure VS Code for web development", "content_type": "video", "duration_minutes": 8, "order": 3},
        {"title": "Understanding Git Basics", "description": "Learn version control fundamentals", "content_type": "video", "duration_minutes": 15, "order": 4},
    ]
    
    for lesson in lessons_m1:
        result = create_lesson(token, module1_id, lesson)
        print(f"  Lesson created: {lesson['title']}")

    # Module 1 Quiz
    quiz1 = create_quiz(token, module1_id, {
        "title": "Setup Fundamentals Quiz",
        "description": "Test your understanding of the development setup",
        "passing_score": 70,
        "time_limit_minutes": 10
    })
    quiz1_id = quiz1.get("quiz_id")
    print(f"  Quiz created: {quiz1_id}")

    # Quiz 1 Questions
    questions_q1 = [
        {
            "question_text": "What command verifies Node.js installation?",
            "options": ["node --version", "npm start", "node install", "npm --verify"],
            "correct_answer": 0,
            "points": 10
        },
        {
            "question_text": "What is npm primarily used for?",
            "options": ["Running JavaScript in browser", "Package management", "Database management", "Server hosting"],
            "correct_answer": 1,
            "points": 10
        },
        {
            "question_text": "Which VS Code extension is essential for JavaScript development?",
            "options": ["Python", "ESLint", "Java", "C++"],
            "correct_answer": 1,
            "points": 10
        }
    ]
    for q in questions_q1:
        add_question(token, quiz1_id, q)
        print(f"    Question added: {q['question_text'][:40]}...")

    # Module 2: Frontend with React
    print("\n--- Module 2: Frontend with React ---")
    module2 = create_module(token, course_id, {
        "title": "Frontend Development with React",
        "description": "Build modern user interfaces with React",
        "order": 2
    })
    module2_id = module2.get("module_id")
    print(f"Module 2 created: {module2_id}")

    lessons_m2 = [
        {"title": "Introduction to React", "description": "What is React and why use it?", "content_type": "video", "duration_minutes": 12, "order": 1, "is_preview": True},
        {"title": "Creating Your First React App", "description": "Use create-react-app to bootstrap a project", "content_type": "video", "duration_minutes": 15, "order": 2},
        {"title": "Components and JSX", "description": "Understanding React components", "content_type": "video", "duration_minutes": 20, "order": 3},
        {"title": "Props and State", "description": "Managing data in React applications", "content_type": "video", "duration_minutes": 25, "order": 4},
        {"title": "Hooks: useState and useEffect", "description": "Modern React state management", "content_type": "video", "duration_minutes": 30, "order": 5},
        {"title": "Handling Events", "description": "User interaction in React", "content_type": "video", "duration_minutes": 15, "order": 6},
        {"title": "Conditional Rendering", "description": "Display content based on conditions", "content_type": "text", "content": """# Conditional Rendering in React

React allows you to conditionally render elements using JavaScript expressions.

## Using if statements
```jsx
function Greeting({ isLoggedIn }) {
  if (isLoggedIn) {
    return <h1>Welcome back!</h1>;
  }
  return <h1>Please sign in.</h1>;
}
```

## Using ternary operator
```jsx
function Status({ online }) {
  return <span>{online ? 'Online' : 'Offline'}</span>;
}
```

## Using && operator
```jsx
function Mailbox({ unreadMessages }) {
  return (
    <div>
      {unreadMessages.length > 0 && (
        <p>You have {unreadMessages.length} unread messages.</p>
      )}
    </div>
  );
}
```""", "duration_minutes": 18, "order": 7},
        {"title": "Lists and Keys", "description": "Rendering lists efficiently", "content_type": "video", "duration_minutes": 12, "order": 8},
    ]
    
    for lesson in lessons_m2:
        result = create_lesson(token, module2_id, lesson)
        print(f"  Lesson created: {lesson['title']}")

    # Module 2 Quiz
    quiz2 = create_quiz(token, module2_id, {
        "title": "React Fundamentals Quiz",
        "description": "Test your React knowledge",
        "passing_score": 70,
        "time_limit_minutes": 15
    })
    quiz2_id = quiz2.get("quiz_id")
    
    questions_q2 = [
        {
            "question_text": "What hook is used to manage state in functional components?",
            "options": ["useEffect", "useState", "useContext", "useReducer"],
            "correct_answer": 1,
            "points": 10
        },
        {
            "question_text": "What does JSX stand for?",
            "options": ["JavaScript XML", "Java Syntax Extension", "JavaScript Extension", "Java Server XML"],
            "correct_answer": 0,
            "points": 10
        },
        {
            "question_text": "How do you pass data from parent to child component?",
            "options": ["State", "Props", "Context", "Redux"],
            "correct_answer": 1,
            "points": 10
        },
        {
            "question_text": "Which hook is used for side effects in React?",
            "options": ["useState", "useCallback", "useEffect", "useMemo"],
            "correct_answer": 2,
            "points": 10
        }
    ]
    for q in questions_q2:
        add_question(token, quiz2_id, q)
        print(f"    Question added: {q['question_text'][:40]}...")

    # Module 3: Backend with Node.js
    print("\n--- Module 3: Backend with Node.js ---")
    module3 = create_module(token, course_id, {
        "title": "Backend Development with Node.js",
        "description": "Build powerful APIs with Express.js",
        "order": 3
    })
    module3_id = module3.get("module_id")
    print(f"Module 3 created: {module3_id}")

    lessons_m3 = [
        {"title": "Introduction to Node.js", "description": "Understanding server-side JavaScript", "content_type": "video", "duration_minutes": 15, "order": 1},
        {"title": "Express.js Basics", "description": "Setting up an Express server", "content_type": "video", "duration_minutes": 20, "order": 2},
        {"title": "REST API Design", "description": "Best practices for API design", "content_type": "video", "duration_minutes": 25, "order": 3},
        {"title": "Middleware in Express", "description": "Understanding middleware functions", "content_type": "text", "content": """# Understanding Express Middleware

Middleware functions have access to the request object (req), response object (res), and the next middleware function.

## Basic Middleware Example
```javascript
const express = require('express');
const app = express();

// Logger middleware
const logger = (req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
};

app.use(logger);

// Auth middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  // Verify token...
  next();
};

// Protected route
app.get('/protected', authenticate, (req, res) => {
  res.json({ message: 'Secret data' });
});
```""", "duration_minutes": 18, "order": 4},
        {"title": "Error Handling", "description": "Handling errors gracefully", "content_type": "video", "duration_minutes": 15, "order": 5},
        {"title": "Authentication with JWT", "description": "Implementing secure authentication", "content_type": "video", "duration_minutes": 30, "order": 6},
    ]
    
    for lesson in lessons_m3:
        result = create_lesson(token, module3_id, lesson)
        print(f"  Lesson created: {lesson['title']}")

    # Module 3 Quiz
    quiz3 = create_quiz(token, module3_id, {
        "title": "Node.js & Express Quiz",
        "description": "Test your backend knowledge",
        "passing_score": 70,
        "time_limit_minutes": 15
    })
    quiz3_id = quiz3.get("quiz_id")
    
    questions_q3 = [
        {
            "question_text": "What is Express.js?",
            "options": ["A database", "A web framework for Node.js", "A frontend library", "A testing tool"],
            "correct_answer": 1,
            "points": 10
        },
        {
            "question_text": "What HTTP method is used to update resources?",
            "options": ["GET", "POST", "PUT", "DELETE"],
            "correct_answer": 2,
            "points": 10
        },
        {
            "question_text": "What does JWT stand for?",
            "options": ["Java Web Token", "JSON Web Token", "JavaScript Web Tool", "JSON Web Type"],
            "correct_answer": 1,
            "points": 10
        }
    ]
    for q in questions_q3:
        add_question(token, quiz3_id, q)
        print(f"    Question added: {q['question_text'][:40]}...")

    # Create final assignment
    print("\n=== Creating Final Assignment ===")
    assignment = create_assignment(token, {
        "title": "Build a Full-Stack Todo Application",
        "description": """## Final Project Assignment

Build a complete full-stack Todo application with the following features:

### Requirements:
1. **Frontend (React)**
   - User registration and login forms
   - Todo list with add, edit, delete functionality
   - Filter todos by status (all, active, completed)
   - Responsive design

2. **Backend (Node.js/Express)**
   - REST API with CRUD operations
   - JWT authentication
   - Input validation
   - Error handling

3. **Database (MongoDB)**
   - User collection
   - Todo collection with user references

### Submission:
Submit your GitHub repository link and a brief explanation of your implementation choices.

### Grading Criteria:
- Code quality and organization (30%)
- Functionality (40%)
- UI/UX design (15%)
- Documentation (15%)""",
        "course_id": course_id,
        "due_days": 14,
        "max_score": 100
    })
    print(f"Assignment created: {assignment}")

    # Update course to be published
    print("\n=== Course Creation Complete! ===")
    print(f"Course ID: {course_id}")
    print("Total Modules: 3")
    print("Total Lessons: 18")
    print("Total Quizzes: 3")
    print("Total Questions: 10")
    print("Final Assignment: 1")

if __name__ == "__main__":
    main()
