# **App Name**: Ephemeral Vault

## Core Features:

- User Authentication: Secure signup and login functionality with email and password, utilizing JWT for session management and httpOnly cookies for enhanced security.
- File Upload: Authenticated users can upload one file at a time. New uploads will replace existing ones to manage storage effectively.
- File Listing: Display a list of the user's uploaded files within their dashboard, enabling easy access and management.
- File Download: Allow users to download their files securely, with access restricted to logged-in users only.
- Automatic File Deletion: Implement a background process to automatically delete files either 1 hour after upload or immediately after they are downloaded.
- Access Control: Ensure files are not publicly accessible and are only available to the user who uploaded them.

## Style Guidelines:

- Primary color: Deep indigo (#3F51B5) for a secure and professional feel.
- Background color: Light grey (#ECEFF1), offering a clean and neutral backdrop to focus attention on content.
- Accent color: Soft amber (#FFB300) to draw attention to interactive elements and key actions, while contrasting for accessibility.
- Body and headline font: 'Inter', a sans-serif, providing a modern and neutral aesthetic, and suitable for both headlines and body text.
- Use minimalist, outline-style icons for clarity and a modern look.
- Emphasize a clean, intuitive layout with ample spacing for easy navigation.
- Incorporate subtle transitions and loading animations to improve user experience without distracting from the core functionality.