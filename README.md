# Moka

This repository hosts the primary codebase for the [Moka](https://moka.vercel.app). A publishing and reading app for digital novels, poems, short-stories, comics and books of all types.

Project code originated from [Minsta](https://minsta-app.vercel.app).

When the Gutenberg press was invented, it changed the way stories were told and knowledge was shared. It meant that words weren't in the minds of a few but always out to everyone everywhere.

Today, the printed book while still available is out and digital is in. But seeking digital books is difficult, there's no way to securely share books and make money for writers.

Enter Moká, writers publish their works and are guaranteed to make money because they can sell copies of books directly to their readers.

Readers purchase books and with the e-reader enjoy the writings of their favourite authors.

Getting started
Visit the website in your browser and connect your wallet. If you don't have a wallet. (Use a testnet wallet with free tokens)

Publish
As a writer, visit the publish link. Add all information and publish your book. Make sure to create copies, which will be unique copies of the same book. Next, list them for sale.

Read
As a reader, you visit the website, assuming you have a wallet and have connected, you'll have to buy a book before you can read (in the future we'll have different pricing models like rent a book, monthly subscription, per page pricing etc).

After you purchase from the store, you can see the book in your "library" and then read the book. The e reader is responsive and a delight to read on mobile and tablet.

Components
To build this prototype I used the following tools and platforms.

1. Mintbase NFT store contract
2. Mintbase SDK
3. NEAR Blockchain
4. NEAR BOS
5. Arweave for permanent storage
6. Next.js

Mintbase NFT contract
Mintbase provides audited smart contracts deployed on NEAR that helps anyone easily create and sell NFTs. I used their V2 contracts with Arweave as data storage as my main backend.

Mintbase JS
On my frontend, I used the MintbaseJS SDK  to query and interact with the NFT data on chain. Payment, transfer, verifying ownership and asserting provenance through the contracts. It made it easy to focus on creating the best possible UX.

NEAR BOS
For writers or publishers, I deployed the publishing app to BOS and it allows writers to publish their books on a fully decentralized layer frontend. That way, they always know what to expect and not have the rules change up on them suddenly.

Future work
To improve the project I plan to 
- improve the reading experience
- encrypt file storage and also add more anti piracy features
- give more buying options like pay-per-page, monthly subscription, renting books, gifting books, 
- resale of owned books
- permanent book annotations. Just like with physical books, where you can highlight passages, make doodles, notes or whatever and it becomes a permanent part of your copy, this is similar where the metadata for a particular book can be updated and it'll be transferred with that book if it's ever resold or transferred *insert screenshot of mock-up*
- 

## Getting Started

To start with this project:

1. Clone the repository.
2. If you don't have `pnpm` installed, run:

   ```bash
   npm install -g pnpm
   ```
   
3. Then, install the required dependencies:

     ```bash
     pnpm install
     ```

## Environment Variables

Refer to the **.env.example** file for the environment variables used in this project. 

If you don't set up a `.env` file or environment variables with your provider, the project will retrieve values from the following files:

1. For CSS generation during build: `generate-css.js`
2. For configuration variables: `src/constants.ts`
3. For fallback metadata and text values: `src/fallback.ts`

## Local Development

To run the project locally, use:

  ```bash
  pnpm dev
  ```

## Updating Environment Variables

### Running Locally

If you're running your project locally, follow these steps to update your environment variables:

1. Save your changes in the `.env` file.
2. Run `pnpm dev` again to apply the updated environment variables.
3. Reload the page to reflect the changes.

### Deployed on Vercel

If you have deployed your project on Vercel, follow these steps to update your environment variables:

1. Log in to your Vercel account.
2. Navigate to the project settings for your deployed app.
3. Update the environment variables in the Vercel dashboard.
4. Trigger a redeployment of your app to apply the changes.

By following these steps, you can ensure that your project uses the updated environment variables.