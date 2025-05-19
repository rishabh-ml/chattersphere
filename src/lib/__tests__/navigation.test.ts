import { routes } from '../navigation';

describe('Navigation Routes', () => {
  describe('routes.profile', () => {
    it('should generate correct profile URL', () => {
      expect(routes.profile('user-123')).toBe('/profile/user-123');
    });
  });

  describe('routes.community', () => {
    it('should generate URL with slug when provided', () => {
      expect(routes.community('test-community')).toBe('/communities/test-community');
    });

    it('should generate URL with ID when slug is not provided', () => {
      expect(routes.community(undefined, 'community-123')).toBe('/communities/community-123');
    });

    it('should prefer slug over ID when both are provided', () => {
      expect(routes.community('test-community', 'community-123')).toBe('/communities/test-community');
    });
  });

  describe('routes.post', () => {
    it('should generate correct post URL', () => {
      expect(routes.post('post-123')).toBe('/posts/post-123');
    });
  });

  describe('routes.followers', () => {
    it('should generate correct followers URL', () => {
      expect(routes.followers('user-123')).toBe('/profile/user-123/followers');
    });
  });

  describe('routes.following', () => {
    it('should generate correct following URL', () => {
      expect(routes.following('user-123')).toBe('/profile/user-123/following');
    });
  });

  describe('routes.channel', () => {
    it('should generate correct channel URL', () => {
      expect(routes.channel('community-slug', 'channel-slug')).toBe('/communities/community-slug/channel-slug');
    });
  });

  describe('Static routes', () => {
    it('should generate correct home URL', () => {
      expect(routes.home()).toBe('/home');
    });

    it('should generate correct popular URL', () => {
      expect(routes.popular()).toBe('/popular');
    });

    it('should generate correct explore URL', () => {
      expect(routes.explore()).toBe('/explore');
    });

    it('should generate correct notifications URL', () => {
      expect(routes.notifications()).toBe('/notifications');
    });

    it('should generate correct saved URL', () => {
      expect(routes.saved()).toBe('/saved');
    });

    it('should generate correct messages URL', () => {
      expect(routes.messages()).toBe('/messages');
    });

    it('should generate correct settings URL', () => {
      expect(routes.settings()).toBe('/settings');
    });

    it('should generate correct help URL', () => {
      expect(routes.help()).toBe('/help');
    });

    it('should generate correct create community URL', () => {
      expect(routes.createCommunity()).toBe('/communities/create');
    });
  });
});
