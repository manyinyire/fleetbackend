import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignUpForm } from '@/components/auth/signup-form'
import { LoginForm } from '@/components/auth/login-form'

// Mock the auth actions
jest.mock('@/server/actions/auth', () => ({
  signUp: jest.fn(),
}))

jest.mock('better-auth/react', () => ({
  signIn: {
    email: jest.fn(),
  },
}))

describe('Authentication Forms', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('SignUpForm', () => {
    it('should render all form fields', () => {
      render(<SignUpForm />)

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
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

      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument()
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument()
      expect(screen.getByText(/company name must be at least 2 characters/i)).toBeInTheDocument()
      expect(screen.getByText(/phone number must be at least 10 characters/i)).toBeInTheDocument()
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
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

      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument()
    })

    it('should submit form with valid data', async () => {
      const mockSignUp = require('@/server/actions/auth').signUp
      mockSignUp.mockResolvedValue(undefined)

      const user = userEvent.setup()
      render(<SignUpForm />)

      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
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
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
      await user.type(screen.getByLabelText(/company name/i), 'Test Company')
      await user.type(screen.getByLabelText(/phone number/i), '+1234567890')
      await user.type(screen.getByLabelText(/^password/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument()
      })
    })

    it('should show loading state during submission', async () => {
      const mockSignUp = require('@/server/actions/auth').signUp
      mockSignUp.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

      const user = userEvent.setup()
      render(<SignUpForm />)

      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
      await user.type(screen.getByLabelText(/company name/i), 'Test Company')
      await user.type(screen.getByLabelText(/phone number/i), '+1234567890')
      await user.type(screen.getByLabelText(/^password/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      expect(screen.getByText(/creating account.../i)).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })
  })

  describe('LoginForm', () => {
    it('should render login form fields', () => {
      render(<LoginForm />)

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
      expect(screen.getByText(/remember me/i)).toBeInTheDocument()
      expect(screen.getByText(/forgot your password/i)).toBeInTheDocument()
    })

    it('should validate required fields', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument()
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
    })

    it('should submit form with valid data', async () => {
      const mockSignIn = require('better-auth/react').signIn
      mockSignIn.email.mockResolvedValue({ error: null })

      const user = userEvent.setup()
      render(<LoginForm />)

      await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password/i), 'password123')

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSignIn.email).toHaveBeenCalledWith({
          email: 'john@example.com',
          password: 'password123',
        })
      })
    })

    it('should handle login errors', async () => {
      const mockSignIn = require('better-auth/react').signIn
      mockSignIn.email.mockResolvedValue({ 
        error: { message: 'Invalid credentials' } 
      })

      const user = userEvent.setup()
      render(<LoginForm />)

      await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password/i), 'wrongpassword')

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
      })
    })

    it('should show loading state during submission', async () => {
      const mockSignIn = require('better-auth/react').signIn
      mockSignIn.email.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

      const user = userEvent.setup()
      render(<LoginForm />)

      await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password/i), 'password123')

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      expect(screen.getByText(/signing in.../i)).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
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