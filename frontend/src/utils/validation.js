export const validation = {
  username: {
    pattern: /^[a-zA-Z0-9_]{3,20}$/,
    message: 'Username must be 3-20 characters and contain only letters, numbers, and underscores'
  },
  password: {
    // Updated regex to allow special characters
    pattern: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
    message: 'Password must be at least 8 characters and contain at least one letter, one number, and one special character'
  },
  nickname: {
    pattern: /^[a-zA-Z0-9_\s]{3,20}$/,
    message: 'Nickname must be 3-20 characters and contain only letters, numbers, spaces, and underscores'
  }
};