import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'react-hot-toast'
import SignupWithPassword from '@/components/Auth/SignupWithPassword'
import SigninWithPassword from '@/components/Auth/SigninWithPassword'

const SignUpForm = SignupWithPassword
const LoginForm = SigninWithPassword

// Mock the auth actions
jest.mock('@/server/actions/auth', () => ({
  signUp: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}))

describe('Authentication Forms', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('SignUpForm', () => {
    it('should render all form fields', () => {
      render(<SignUpForm />)

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })

    it('should validate required fields', async () => {
      const user = userEvent.setup()
      render(<SignUpForm />)

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      expect(toast.error).toHaveBeenCalledWith('All fields are required')
    })

    it('should validate password confirmation', async () => {
      const user = userEvent.setup()
      render(<SignUpForm />)

      const passwordField = screen.getByLabelText(/^password/i)
      const confirmPasswordField = screen.getByLabelText(/confirm password/i)

      await user.type(passwordField, 'password123')
      await user.type(confirmPasswordField, 'different123')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      expect(toast.error).toHaveBeenCalledWith("Passwords don't match")
    })

    it('should submit form with valid data', async () => {
      const mockSignUp = require('@/server/actions/auth').signUp
      mockSignUp.mockResolvedValue(undefined)

      const user = userEvent.setup()
      render(<SignUpForm />)

      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/company name/i), 'Test Company')
      await user.type(screen.getByLabelText(/phone number/i), '+1234567890')
      await user.type(screen.getByLabelText(/^password/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(expect.any(FormData))
      })
    })

    it('should handle form submission errors', async () => {
      const mockSignUp = require('@/server/actions/auth').signUp
      mockSignUp.mockRejectedValue(new Error('Email already exists'))

      const user = userEvent.setup()
      render(<SignUpForm />)

      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/company name/i), 'Test Company')
      await user.type(screen.getByLabelText(/phone number/i), '+1234567890')
      await user.type(screen.getByLabelText(/^password/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Email already exists')
      })
    })

    it('should show loading state during submission', async () => {
      const mockSignUp = require('@/server/actions/auth').signUp
      mockSignUp.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

      const user = userEvent.setup()
      const { container } = render(<SignUpForm />)

      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/company name/i), 'Test Company')
      await user.type(screen.getByLabelText(/phone number/i), '+1234567890')
      await user.type(screen.getByLabelText(/^password/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      expect(submitButton).toBeDisabled()
      expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })

  describe('LoginForm', () => {
    it('should render login form fields', () => {
      render(<LoginForm />)

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
      expect(screen.getByText(/remember me/i)).toBeInTheDocument()
      expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
    })

    it('should validate required fields', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      expect(toast.error).toHaveBeenCalledWith('Invalid email address')
    })

    it('should submit form with valid data', async () => {
      const mockSignIn = require('next-auth/react').signIn
      mockSignIn.mockResolvedValue({ ok: true, error: null })

      const user = userEvent.setup()
      render(<LoginForm />)

      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password/i), 'password123')

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          email: 'john@example.com',
          password: 'password123',
          redirect: false,
        })
      })
    })

    it('should handle login errors', async () => {
      const mockSignIn = require('next-auth/react').signIn
      mockSignIn.mockResolvedValue({
        error: 'Invalid credentials',
      })

      const user = userEvent.setup()
      render(<LoginForm />)

      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password/i), 'wrongpassword')

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Invalid credentials')
      })
    })

    it('should show loading state during submission', async () => {
      const mockSignIn = require('next-auth/react').signIn
      mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

      const user = userEvent.setup()
      const { container } = render(<LoginForm />)

      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password/i), 'password123')

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      expect(submitButton).toBeDisabled()
      expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('should toggle remember me checkbox', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const rememberMeCheckbox = screen.getByLabelText(/remember me/i)
      expect(rememberMeCheckbox).not.toBeChecked()

      await user.click(rememberMeCheckbox)
      expect(rememberMeCheckbox).toBeChecked()
    })
  })
})
