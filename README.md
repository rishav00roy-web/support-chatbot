# Support Chatbot

An AI customer-support assistant for small businesses, by [Atelier Systems](https://byrishav.online).

It answers visitors' questions using only your own business information, suggests follow-up questions, picks up on the visitor's mood, and hands over to a human when it can't help or when it's asked to.

## What's different from the original

- **Groq or Claude.** Set `GROQ_API_KEY` to use Groq, or `ANTHROPIC_API_KEY` to use Claude.
- **No AWS needed.** The bot answers from the markdown files in [`knowledge/`](knowledge). Edit `knowledge/faq.md` for each business. Amazon Bedrock still works if you add AWS keys.
- **Safer API.** The model is chosen on the server, so visitors can't switch to an expensive one, and the debug header no longer shows part of the API key.
- **Your brand.** Business name comes from `BUSINESS_NAME` / `NEXT_PUBLIC_BRAND_NAME`. Third-party logos have been removed.

## Run it

```bash
npm install
cp .env.example .env.local   # add your GROQ_API_KEY
npm run dev
```

Open http://localhost:3000.

## Deploy

Import the repo on [Vercel](https://vercel.com/new) and add the same environment variables. Nothing else is needed.

## Set it up for a client

1. Replace `knowledge/faq.md` with their services, prices, hours and policies. Add more `.md` files if you like.
2. Set `BUSINESS_NAME` and `NEXT_PUBLIC_BRAND_NAME`.
3. Deploy. Use `npm run build:chat` for a chat-only layout without the side panels.

## Credits

Based on the Customer Support Agent from [anthropics/claude-quickstarts](https://github.com/anthropics/claude-quickstarts/tree/main/customer-support-agent), released under the MIT License. The original license is kept in [LICENSE](LICENSE).
