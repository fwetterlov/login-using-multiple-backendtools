# Lab 4 - Backend

This is a web page that implements role-based authorization and authentication using JSON web tokens. The page has different routes that are accessible only to users with the appropriate role, which includes two types of students, a teacher, and an administrator. The user's JSON web token is stored in their browser as a cookie and is used to authenticate their access to different parts of the website. The user data is stored in a SQLite database for easy access and management.

## Usage
1. Clone the repository from GitHub: `git clone https://github.com/fwetterlov/login-using-multiple-backendtools.git`
2. Install the required dependencies: `npm install`
3. Navigate to the project directory: `cd login-using-multiple-backendtools`
4. Start the server: `npm run server`
5. Access the webpage from a web browser at `http://localhost:1337`

To stop the server, press `Ctrl+C` and then type `Y`.

## Requirements

* Node.js
