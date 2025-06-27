# **App Name**: Health Harmony AI

## Core Features:

- User Profile Management: Securely create, read, and update user health profiles containing allergies, medications, and conditions using Firebase Authentication and Firestore.
- AI Compatibility Check: Submit a new drug or food item for compatibility analysis. The system fetches the user's health profile and constructs a prompt for the Gemini API tool to evaluate potential interactions, contraindications and risks.
- Medical Disclaimer: Implement mandatory medical disclaimer to be included in all AI-generated analyses.
- API Endpoints: Implement RESTful API endpoints for profile management and compatibility checks, using Flask framework.

## Style Guidelines:

- Primary color: Light teal (#A0CED9) for a calm and trustworthy feel.
- Background color: Off-white (#F0F4F8) to create a clean and accessible interface.
- Accent color: Soft orange (#F2BEA3) to highlight important actions.
- Body and headline font: 'Inter', a grotesque-style sans-serif known for its modern, objective, and neutral look, making it ideal for medical information.
- Use simple, clear icons to represent different health aspects (allergies, medications) for better user understanding.
- Maintain a clean, well-structured layout to make it easier for users to find information.
- Add subtle animations to indicate loading or processing of data to improve user experience.