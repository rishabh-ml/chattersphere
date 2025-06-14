describe("Home Page", () => {
  beforeEach(() => {
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

    // Mock posts API
    cy.intercept("GET", "/api/posts/feed*", {
      statusCode: 200,
      body: {
        posts: [
          {
            id: "post-1",
            author: {
              id: "user-1",
              username: "testuser",
              name: "Test User",
              image: "https://example.com/avatar.jpg",
            },
            content: "This is a test post content",
            upvoteCount: 10,
            downvoteCount: 2,
            voteCount: 8,
            commentCount: 5,
            isUpvoted: false,
            isDownvoted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          totalPosts: 1,
          hasMore: false,
        },
      },
    });

    cy.visit("/");
  });

  it("displays the header", () => {
    cy.get("header").should("be.visible");
    cy.contains("ChatterSphere").should("be.visible");
  });

  it("displays posts in the feed", () => {
    cy.contains("This is a test post content").should("be.visible");
    cy.contains("Test User").should("be.visible");
  });

  it("allows upvoting a post", () => {
    // Mock the upvote API
    cy.intercept("POST", "/api/posts/*/upvote", {
      statusCode: 200,
      body: { success: true },
    });

    cy.get('[aria-label="Upvote"]').first().click();

    // Verify the upvote button is active
    cy.get('[aria-label="Upvote"]').first().should("have.class", "text-green-500");
  });

  it("navigates to user profile when clicking on author name", () => {
    cy.contains("Test User").click();
    cy.url().should("include", "/profile/user-1");
  });
});
