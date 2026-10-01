---
title: LakeCivic
summary: Multi-tenant software for HOAs and neighborhood associations. Members and households, dues through Stripe Connect, events, forums, a page builder for each community's site, and a member app.
standfirst: Software for HOAs, lake associations and neighborhood associations. Each community gets members and households, dues and donations, events, forums and documents, its own website with a drag-and-drop page builder, and a mobile app for members.
category: Products
year: 2026
status: Live
stack: [React, TypeScript, Convex, Stripe Connect, Expo, React Native, Puck]
cover: /projects/lakecivic/cover.webp
coverAlt: LakeCivic dashboard for a demo lake association
order: 7
links:
  - label: lakecivic.com
    href: https://lakecivic.com
endTitle: Live, with a pilot community
endText: LakeCivic is live at lakecivic.com with one pilot neighborhood association. It's a business I started and built myself, so the repos are private.
---
Most neighborhood associations run on a spreadsheet, a mailing list and somebody's personal PayPal. LakeCivic replaces that with one place for the whole association: who lives where, who has paid, what's coming up, what the board decided, and a public website the board can edit without calling anyone. I started it as a business and built it myself.

![Dashboard overview](/projects/lakecivic/dashboard-overview.webp "The dashboard for a demo association. Everything shown here is a fictional community with example.com members.")

## What a community gets

- **Its own subdomain and site.** Every organization lives at `{slug}.lakecivic.com`, with a public website and a members' dashboard.
- **Households, not just users.** A household has a primary member, secondary members who are invited and can log in, and tertiary members (kids, say) who can't. The member directory respects each person's privacy settings.
- **Money.** Each organization connects its own Stripe account through Stripe Connect. Dues, donations, event tickets and store orders all go through Stripe Checkout, with a small platform fee. LakeCivic bills each organization for its own subscription separately, with a trial and a paywall.
- **Events.** RSVPs for several household members at once, capacity and waitlists, paid tickets, a calendar feed per organization, and scheduled reminders for events and renewals.
- **Everything else an association does.** Forums, announcements, committees, volunteer shifts, surveys, meeting topics with votes, galleries, documents and an audit log. The schema has 38 tables.
- **Messaging.** Email campaigns and transactional email, an inbound inbox, and SMS.

![Households](/projects/lakecivic/dashboard-households.webp "Households with roles, addresses and dues status.")

## A website builder for each community

Boards want a website, and nobody on a board wants to learn a CMS. LakeCivic uses [Puck](https://puckeditor.com), a visual editor, with a dozen custom blocks (hero, features, FAQ, board members, stats, testimonials, newsletter signup) and page templates for Home, About, Contact, FAQ, Events and Rules. Pages render on the community's public subdomain, and images upload to the backend's file storage.

![Page editor](/projects/lakecivic/website-editor.webp "The page editor. Blocks on the left, a live preview of the Home template in the middle.")

## How it is built

### One backend, two clients, no API layer

The backend is [Convex](https://www.convex.dev), self-hosted. The React web app and the React Native member app both subscribe to the same Convex queries over WebSockets, and the mobile repo checks in the web repo's generated API types. The two clients share one typed contract, and there is no REST layer to keep in sync. Access is checked on the server in every function, against a five-level role hierarchy from platform admin down to member.

### Signing in across subdomains

Users sign in on the main domain, but each community lives on its own subdomain, and browser storage doesn't cross subdomains. After sign-in, the session token and refresh token move to the community's subdomain in the URL's **hash fragment**, which is never sent to a server. A tiny boot script writes them into that subdomain's storage before the backend client starts.

### Two sides of Stripe

Community revenue and platform revenue are different problems. Community payments go to each organization's own connected Stripe account, with an application fee on each charge. The platform subscription is billed separately, and its trial and grace logic is computed when it is read rather than stored, so introducing billing needed no data migration for the pilot. Stripe webhooks are signature-verified.

![Events](/projects/lakecivic/dashboard-events.webp "Events with visibility, ticket prices, RSVPs and a calendar feed.")

### The member app

The member app is Expo and React Native, with about 20 screens: events and RSVPs, the directory, forums with posting, household management with invite links, donations through Stripe Checkout, documents, galleries, volunteering, surveys, committees and contact preferences. Releases are one command: it takes the version from git tags, asks the Google Play API for the last version code, builds the bundle, uploads it with a small Go CLI, and only then commits and tags.

## Status

LakeCivic is live at [lakecivic.com](https://lakecivic.com), used by one pilot neighborhood association. Payments were still in test mode as of mid-2026. The member app is distributed through Google Play's testing tracks. The repos are private.
