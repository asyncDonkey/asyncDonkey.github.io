# asyncDonkey.io | Project Hub & Tech Portfolio ✨

Welcome to the GitHub repository for asyncDonkey.io, a personal project hub and technology portfolio. This site documents a learning and development journey focused on Full-Stack technologies, showcasing practical applications, games, and technical articles.

**🚀 Live Demo:** [**https://asyncDonkey.github.io/**](https://asyncDonkey.github.io/)

---

## 📖 About This Project

asyncDonkey.io was initiated as a platform to apply and consolidate web development skills, with an initial emphasis on frontend technologies and an expansion towards full-stack functionalities using Firebase. The site aims to combine analytical problem-solving with the creation of interactive and engaging web solutions.

---

## ✨ Key Implemented Features

This project includes several dynamic and interactive features, such as:

- **User Authentication System:**
    - User registration and login via Firebase Authentication.
    - Dedicated registration page with clear information (nickname and nationality set upon registration).
    - Email verification (to be implemented).
    - User session management and conditional content display.
- **User Profiles:**
    - Public profile viewing (`profile.html?userId=xxx`).
    - Viewing one's own profile with dedicated sections.
    - Dynamically generated Blockie avatars based on user ID.
    - (Future) Ability to set a "Status/Mood" and link external content.
- **Article System (Blog):**
    - Article submission by users via a Markdown editor (EasyMDE).
    - Admin moderation workflow (`pendingReview`, `published`, `rejected`) with feedback (`rejectionReason`).
    - Article display with Markdown parsing.
    - "Like" functionality for articles and comments, with a "likers" display.
    - Comment section for each article.
    - Personal draft management and display of all article statuses for the author.
    - Pre-population of the submission form based on rejected articles.
- **Game "CodeDash! Runner":**
    - Endless runner game developed in vanilla JavaScript with `<canvas>`.
    - Score saving to Firebase Firestore.
    - Global leaderboard and homepage mini-leaderboard.
    - Power-up system.
    - (Future) "Glitchzilla" boss.
- **General Guestbook:**
    - Allows users (logged in and anonymous) to leave comments on the platform.
    - "Like" functionality for guestbook comments.
- **Issue/Suggestion Tracking System:**
    - `contribute.html` page for submitting reports or suggestions.
    - Issue display and filtering.
    - "Upvote" functionality for issues.
    - Admin moderation of issue statuses.
- **Admin Dashboard (`admin-dashboard.html`):**
    - Full article lifecycle management (review, approval, editing, rejection).
    - Moderation of user-submitted issues.
    - Viewing drafts and rejected articles.
- **General UI/UX Enhancements:**
    - Light/Dark Mode theme with local persistence.
    - "Scroll to Top" button.
    - Toast notifications for user feedback.
    - Responsive design.
    - Intuitive navigation.
- **Content Sharing:**
    - (To be Implemented) Buttons to share articles and scores.

---

---

## 🛠️ Technologies Used

This project leverages a modern web development stack, focusing on vanilla JavaScript for core logic and Firebase for backend services.

-   **Frontend Development:**
    -   **HTML5:** Semantic markup for structuring web content, ensuring accessibility and SEO best practices.
    -   **CSS3:** Advanced styling for a responsive and engaging user interface, utilizing Flexbox, Grid, CSS Variables for theming.
    -   **JavaScript (ES6+ Modules):** Core aclient-side logic, DOM manipulation, event handling, and asynchronous programming (Promises, `async/await`). All custom vanilla JS.

-   **Backend & Database (BaaS - Backend as a Service):**
    -   **Firebase Platform:**
        -   **Firestore:** NoSQL, document-based database for storing dynamic data such as user profiles, articles, comments, leaderboard scores, and user-submitted issues.
        -   **Firebase Authentication:** Secure user registration (dedicated page with email/password) and login, session management.
        -   **Cloud Functions for Firebase (Node.js):** Serverless functions for backend logic triggered by Firestore events (e.g., updating user profiles based on game achievements or article publications). *(New)*
        -   **Firestore Security Rules:** Robust, server-side rules to protect data integrity and ensure proper access control.
        -   **Firebase Hosting (currently via GitHub Pages):** Serving static and dynamic content. (Potresti menzionare che attualmente usi GitHub Pages ma stai esplorando/usando Firebase per le funzioni).

-   **Key JavaScript Libraries & APIs:**
    -   **EasyMDE:** WYSIWYG Markdown editor for article submission.
    -   **Marked.js:** Markdown parser for rendering article content.
    -   **Blockies (Ethereum):** Generation of unique, Ethereum-style "identicon" avatars based on user IDs.
    -   **Flag Icons (Lipis):** Displaying country flags for user nationalities.
    -   **Material Symbols (Google):** Modern icon library for UI elements. *(New)*
    -   **Navigator Share API & Clipboard API:** For content sharing functionalities.

-   **Development Tooling & Code Quality:**
    -   **Git & GitHub:** Version control and repository management.
    -   **ESLint:** JavaScript linter for identifying and fixing problems in JavaScript code (using Flat Config: `eslint.config.mjs`).
    -   **Prettier:** Code formatter for maintaining consistent code style.
    -   **Firebase CLI & Emulator Suite:** For local development, testing of Cloud Functions and Firestore rules, and deployment. *(New)*
    -   **`.gitignore`**: To exclude unnecessary files from version control.

-   **Development Environment:**
    -   Primarily developed using **GitHub Codespaces** and **VS Code with Dev Containers**, ensuring a consistent Node.js-based development environment.

---

## 🚀 Getting Started / Development

This project is best configured to run within a **Dev Container**, which provides a consistent and pre-configured development environment.

**Using GitHub Codespaces (Recommended):**

1.  Navigate to the repository page on GitHub.
2.  Click the "Code" button.
3.  Select the "Codespaces" tab.
4.  Click "Create codespace on [branch-name]".
5.  The environment will automatically set up based on the `.devcontainer/devcontainer.json` file (which includes Node.js, ESLint, Prettier, and recommended VS Code extensions).

**Using VS Code Locally with Dev Containers:**

1.  Ensure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
2.  Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) in VS Code.
3.  Clone the repository: `git clone https://github.com/asyncDonkey/asyncDonkey.github.io.git`
4.  Open the cloned folder in VS Code.
5.  VS Code should detect the `.devcontainer` folder and prompt you to "Reopen in Container." Click this option.
6.  Once the container is built and running, you can use the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension (already included in the dev container configuration) to preview the website. Right-click on `index.html` and select "Open with Live Server."

---

## 🗺️ Roadmap and Next Steps

The project is continuously evolving. Current priorities include:

1.  **Finalizing the new centralized registration flow and simplifying user profiles.**
2.  **Enhancements to the user profile page (Status/Mood, External Links, Public Profile).**
3.  **Implementation of sharing buttons.**
4.  **In-depth documentation of the code and data structures.**
5.  **Ongoing testing and Quality Assurance.**

For a detailed view of future tasks and progress, please refer to the [DEVELOPMENT_PLAN.md](documentation/DEVELOPMENT_PLAN.md) file (or the latest development plan file in the `documentation/` folder).

---

## 🤝 Contributing

Feedback and contributions are welcome! If you want to report a bug, suggest a new feature, or contribute to the code:

1.  **Reports and Suggestions:** Visit the [Contribute](https://asyncdonkey.github.io/contribute.html) page on the website to submit feedback via the integrated issue tracking system.
2.  **GitHub Issues:** For more technical matters or to see open issues, visit the [Issues section](https://github.com/asyncDonkey/asyncDonkey.github.io/issues) of this repository. Please use the provided templates for bug reports or feature requests.
3.  **Pull Requests:** If you wish to contribute code directly, please:
    - Fork the repository.
    - Create a new branch for your changes (`git checkout -b feature/FeatureName` or `bugfix/BugDescription`).
    - Commit your changes.
    - Ensure your code is formatted with Prettier and that ESLint reports no errors (`npx eslint .` and `npx prettier . --check`).
    - Open a Pull Request to the `main` branch (or the current development branch) of the original repository, clearly describing the changes made.

---

## 📫 Contact

Let's connect!

- **Email:** `asyncdonkey@proton.me`
- **LinkedIn:** [Umberto Trombetta](https://www.linkedin.com/in/umberto-trombetta)
- **GitHub:** [asyncDonkey](https://github.com/asyncDonkey) (You are here!)

---

Thanks for checking out the asyncDonkey.io repository!
