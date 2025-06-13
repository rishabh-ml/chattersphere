/// <reference types="cypress" />
export {}; // ← this turns the file into a module

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
// ***********************************************

// -- This is a parent command --
Cypress.Commands.add("login", () => {
  // Mock Clerk authentication
  cy.intercept("GET", "/api/clerk/user", {
    statusCode: 200,
    body: {
      id: "test-user-id",
      username: "testuser",
      firstName: "Test",
      lastName: "User",
      imageUrl: "https://example.com/avatar.jpg",
    },
  });

  // Set local storage to simulate authenticated state
  localStorage.setItem(
    "clerk-user",
    JSON.stringify({
      id: "test-user-id",
      username: "testuser",
      firstName: "Test",
      lastName: "User",
      imageUrl: "https://example.com/avatar.jpg",
    })
  );
});

// -- Type augmentations for our custom command --
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Custom login command simulating Clerk auth
       */
      login(): Chainable<void>;
    }
  }
}
