import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AboutTab from '../AboutTab';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('AboutTab', () => {
  const mockUser = {
    id: '123',
    clerkId: 'clerk_123',
    username: 'testuser',
    name: 'Test User',
    bio: 'This is a test bio',
    pronouns: 'they/them',
    location: 'Test City',
    website: 'https://example.com',
    socialLinks: [
      { platform: 'Twitter', url: 'https://twitter.com/testuser' },
      { platform: 'GitHub', url: 'https://github.com/testuser' },
    ],
    interests: ['coding', 'reading', 'music'],
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  };

  const mockProps = {
    user: mockUser,
    isOwner: false,
    onProfileUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user information in view mode', () => {
    render(<AboutTab {...mockProps} />);

    expect(screen.getByText('Profile Info')).toBeInTheDocument();
    expect(screen.getByText(mockUser.bio)).toBeInTheDocument();
    expect(screen.getByText(mockUser.pronouns)).toBeInTheDocument();
    expect(screen.getByText(mockUser.location)).toBeInTheDocument();
    expect(screen.getByText(mockUser.website)).toBeInTheDocument();

    // Check social links
    expect(screen.getByText('Twitter:')).toBeInTheDocument();
    expect(screen.getByText('GitHub:')).toBeInTheDocument();

    // Check interests
    mockUser.interests.forEach(interest => {
      expect(screen.getByText(interest)).toBeInTheDocument();
    });
  });

  it('shows Edit button when isOwner is true', () => {
    render(<AboutTab {...mockProps} isOwner={true} />);

    const editButton = screen.getByRole('button', { name: /edit/i });
    expect(editButton).toBeInTheDocument();
  });

  it('switches to edit mode when Edit button is clicked', () => {
    render(<AboutTab {...mockProps} isOwner={true} />);

    // Click Edit button
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    // Check if edit form is displayed
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pronouns/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/website/i)).toBeInTheDocument();
  });

  it('pre-fills form fields with user data in edit mode', () => {
    render(<AboutTab {...mockProps} isOwner={true} />);

    // Click Edit button
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    // Check if form fields are pre-filled
    expect(screen.getByLabelText(/bio/i)).toHaveValue(mockUser.bio);
    expect(screen.getByLabelText(/pronouns/i)).toHaveValue(mockUser.pronouns);
    expect(screen.getByLabelText(/location/i)).toHaveValue(mockUser.location);
    expect(screen.getByLabelText(/website/i)).toHaveValue(mockUser.website);
  });

  it('submits form data when Save button is clicked', async () => {
    render(<AboutTab {...mockProps} isOwner={true} />);

    // Click Edit button
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    // Modify form fields
    fireEvent.change(screen.getByLabelText(/bio/i), { target: { value: 'Updated bio' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    // Check if onProfileUpdate was called with updated data
    await waitFor(() => {
      expect(mockProps.onProfileUpdate).toHaveBeenCalledWith(expect.objectContaining({
        bio: 'Updated bio',
        pronouns: mockUser.pronouns,
        location: mockUser.location,
        website: mockUser.website,
      }));
    });
  });

  it('allows adding and removing interests', () => {
    render(<AboutTab {...mockProps} isOwner={true} />);

    // Click Edit button
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    // Add a new interest
    fireEvent.change(screen.getByPlaceholderText(/add an interest/i), { target: { value: 'gaming' } });
    fireEvent.click(screen.getByRole('button', { name: '' })); // The Add button has no accessible name

    // Check if the new interest is added
    expect(screen.getByText('gaming')).toBeInTheDocument();

    // Remove an interest
    const removeButtons = screen.getAllByRole('button', { name: '' }); // The remove buttons have no accessible name
    fireEvent.click(removeButtons[0]); // Remove the first interest

    // Check if the interest was removed
    expect(screen.queryByText('coding')).not.toBeInTheDocument();
  });

  it('allows adding and removing social links', () => {
    render(<AboutTab {...mockProps} isOwner={true} />);

    // Click Edit button
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    // Add a new social link
    fireEvent.change(screen.getByPlaceholderText(/platform/i), { target: { value: 'LinkedIn' } });
    fireEvent.change(screen.getByPlaceholderText(/url/i), { target: { value: 'https://linkedin.com/in/testuser' } });
    const addButtons = screen.getAllByRole('button', { name: '' }); // The Add button has no accessible name
    fireEvent.click(addButtons[addButtons.length - 1]); // The last button should be the Add button for social links

    // Check if the new social link is added
    expect(screen.getByText('LinkedIn:')).toBeInTheDocument();

    // Remove a social link
    const removeButtons = screen.getAllByRole('button', { 'aria-label': undefined });
    const trashButtons = removeButtons.filter(button => button.classList.contains('text-red-500'));
    fireEvent.click(trashButtons[0]); // Remove the first social link

    // Check if the social link was removed
    expect(screen.queryByText('Twitter:')).not.toBeInTheDocument();
  });

  it('validates form data before submission', async () => {
    render(<AboutTab {...mockProps} isOwner={true} />);

    // Click Edit button
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    // Enter invalid website URL
    fireEvent.change(screen.getByLabelText(/website/i), { target: { value: 'invalid-url' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    // Check if validation error is shown
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });

    // onProfileUpdate should not be called
    expect(mockProps.onProfileUpdate).not.toHaveBeenCalled();
  });
});
