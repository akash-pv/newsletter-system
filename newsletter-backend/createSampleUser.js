//createSampleUser.js

const bcrypt = require("bcryptjs");
const db = require("./config/db");

// Array of users to be inserted
const users = [
  { full_name: "Granacho ad", email: "g@example.com", password: "admin1234", role_id: 1 },    // Admin
  { full_name: "Rashford em", email: "r@example.com", password: "employee1234", role_id: 3 }, // Employee
  { full_name: "Antony ap", email: "a@example.com", password: "approver1234", role_id: 2 }    // Approver
];

const insertUser = (user) => {
  bcrypt.hash(user.password, 10, (err, hashedPassword) => {
    if (err) {
      console.error(`Error hashing password for ${user.email}:`, err);
      return;
    }

    db.query(
      "INSERT INTO User (full_name, email, password_hash) VALUES (?, ?, ?)",
      [user.full_name, user.email, hashedPassword],
      (err, result) => {
        if (err) {
          console.error(`Insert User Error for ${user.email}:`, err.message);
          return;
        }

        const userId = result.insertId;

        db.query(
          "INSERT INTO User_Role (user_id, role_id) VALUES (?, ?)",
          [userId, user.role_id],
          (err) => {
            if (err) {
              console.error(`Insert Role Error for ${user.email}:`, err.message);
              return;
            }
            console.log(`${user.full_name} (${user.email}) inserted with role ID ${user.role_id}`);
          }
        );
      }
    );
  });
};

users.forEach(insertUser);
