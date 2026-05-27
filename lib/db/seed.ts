import { stripe } from '../payments/stripe';
import { db } from './drizzle';
import { users, teams, teamMembers } from './schema';
import { hashPassword } from '@/lib/auth/session';

async function createStripeProducts() {
  console.log('Creating Stripe credit packages...');

  const packages = [
    {
      name: 'Starter Credits',
      description: '50 credits for ecommerce video generation',
      credits: 50,
      unitAmount: 999,
    },
    {
      name: 'Pro Credits',
      description: '300 credits for ecommerce video generation',
      credits: 300,
      unitAmount: 3999,
    },
    {
      name: 'Business Credits',
      description: '1000 credits for ecommerce video generation',
      credits: 1000,
      unitAmount: 9999,
    },
  ];

  for (const creditPackage of packages) {
    const product = await stripe.products.create({
      name: creditPackage.name,
      description: creditPackage.description,
      metadata: {
        credits: String(creditPackage.credits),
      },
    });

    await stripe.prices.create({
      product: product.id,
      unit_amount: creditPackage.unitAmount,
      currency: 'usd',
      metadata: {
        credits: String(creditPackage.credits),
      },
    });
  }

  console.log('Stripe credit packages created successfully.');
}

async function seed() {
  const email = 'test@test.com';
  const password = 'admin123';
  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values([
      {
        email: email,
        passwordHash: passwordHash,
        role: "owner",
      },
    ])
    .returning();

  console.log('Initial user created.');

  const [team] = await db
    .insert(teams)
    .values({
      name: 'Test Team',
    })
    .returning();

  await db.insert(teamMembers).values({
    teamId: team.id,
    userId: user.id,
    role: 'owner',
  });

  await createStripeProducts();
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
