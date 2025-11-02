# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/ac753516-3aae-47be-a427-f2ca627a014b

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/ac753516-3aae-47be-a427-f2ca627a014b) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Set up Clerk authentication
# Copy the example environment file and add your Clerk Publishable Key
cp env.example .env
# Edit .env and add your actual Clerk Publishable Key from https://dashboard.clerk.com

# Step 5: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Clerk (Authentication)

## Authentication Setup (Clerk)

This project uses Clerk for authentication. To set up:

1. Create a free account at [https://clerk.com](https://clerk.com)
2. Create a new application in your Clerk dashboard
3. Copy your **Publishable Key** from the API Keys page
4. Create a `.env` file in the root directory (copy from `env.example`)
5. Add your Clerk Publishable Key to the `.env` file:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here
```

6. Configure your sign-in and sign-up methods in the Clerk dashboard
7. Run `npm run dev` to start the application

### Protected Routes

The following routes are protected and require authentication:
- `/trips/new` - Create a new trip (requires sign-in)

### Authentication Pages

- `/auth` or `/auth/sign-in` - Sign in page
- `/auth/sign-up` - Sign up page

Users can sign in or sign up using:
- Email and password
- OAuth providers (Google, GitHub, etc.) - Configure in Clerk dashboard

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/ac753516-3aae-47be-a427-f2ca627a014b) and click on Share -> Publish.

**Note**: Make sure to add your Clerk Publishable Key as an environment variable in your deployment settings.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
