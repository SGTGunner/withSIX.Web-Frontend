## Website

### March 28, 2015

* Added: Full OAuth/OpenID Connect endpoint
* Added: Support for Twitch and Reddit logins
* Other: Replaced login flow with new OIDC flow

### March 18, 2015

* Fixed: Publishing new missions
* Other: Improved authentication aspects

### January 28, 2015

* Other: Improved Web and API performance and reliability

### January 22, 2015

* Fixed: Duplication of email and client notifications

### December 18, 2014

* Added: New Header for Mods, Missions and Collections; Lean, Mean and Athmospheric
* Added: Support for locked versions of mods within Collections

### November 16, 2014

* Fixed: Breadcrumbs updates on navigation for SPA
* Fixed: Collection search queries
* Other: Improved document (tab) title handling for SPA
* Other: Moved Dependents and Collections to Related Tab
* Other: Moved Order system to main withSIX site
* Other: Reimplmented microdata for Facebook and Twitter, on Posts, Collections, Mods and Missions

### November 15, 2014

* Other: Improved search engine crawl- and readability of our pages
* Other: Major improvements to rendering performance of many pages, up to 5x
* Other: Only show Related tabs when there is actual related content
* Other: Performance improvements for content index pages

### November 14, 2014

* Fixed: Subscribe/Follow and Unsubscribe/Unfollow
* Other: No longer do a page reload when coming from a static page to SPA

### November 13, 2014

* Other: Converted most of our pages to SPA (Single Page Application)

### November 2, 2014

* Added: Inline editing support of Mod pages for authors
* Added: New editor for making beautiful Mod, Mission and Collection descriptions and Blog posts
* Added: Improved Commenting system with Edit and Delete (archive) support
* Fixed: Various login and remember-me issues with Social sign-in accounts
* Other: Improved infinite scroll behavior of content pages
* Other: Improved performance of Mod pages

### October 13, 2014

* Fixed: Error 500 on social sign-in when session expired and fingerprint lost
* Fixed: You are no longer required to also enter password change info when switching two-factor settings
* Other: Changing account password now revokes remember-me cookies and requires the user to login again
* Other: Enabled cookie abuse warning notification and behavior again this time with improved heuristics to prevent false-positives 
* Other: Replaced login dialog with more compact and appealing version

### October 10, 2014

* Added: Redirect support for when a mod was moved to another game, or when it supports multiple games
* Added: Support for login by Twitter, Microsoft Account and Github.

### October 8, 2014

* Added: Support for linking multiple social sign-in accounts with the same withSIX account
* Added: Uppercase support for User profile and Content slugs
* Added: UTF8 support for slugs
* Fixed: Registering through google login provider could lead to having a username with just random numbers depending on character set used in google account.

### October 2, 2014

* Fixed: Avatar refresh issues on new avatar upload / switch between Gravatar and custom avatar.
* Fixed: Cookie login for HTTP users; redirects to HTTPS to login again
* Fixed: Logout of client due to HTTP usage on initial pageload
* Fixed: Me/Profile content pages
* Fixed: Mission publishing issues 
* Fixed: Various error 500's because of minor concurrency issues
* Other: Improved Mission publishing form feedback
* Other: Improved loading of S.I.R hubs (CDN)

### September 26, 2014

* Added: Optional TwoFactor authentication by Email
* Fixed: Cookie security false-positives
* Fixed: Interaction with the client (e.g when subscribing to collections)
* Other: API is back on standard SSL port 443
* Other: Assets are now delivered from worldwide CDN
* Other: Major optimizations to hosting platform

### September 18, 2014

* Introduced Premium! [Go Premium](https://withsix.com/gopremium)
* Major experience and technology overhaul for:
 * Login, Register, Finalize, Activate and Forgot Password pages
 * User settings pages
 * Profile pages
 * Mission publishing and editing
 * Stay logged-in, require entering password when changing sensitive data
 * Emails
 * Form feedback
 * Page loading indicators; at the top and at the position where content is loading
 * Overall performance and smoothness
* Authored content displayed on User Profiles and Me section
* Improved Header and general space optimization
* Much improved browsing of Mods, Missions, and Collections, incl advanced filtering, and improved search.
* New URL format for Missions and Mods (SHORT-ID/FULL-NAME-SLUG), putting them in line with collections.
* Added ability to report/flag content (e.g inappropriate, violates license/terms, etc)
* Improved ability for authors to claim their own content, in preparation of giving authors access to manage their own content metadata and later also the data itself