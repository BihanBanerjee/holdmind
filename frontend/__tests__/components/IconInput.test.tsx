import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { IconInput } from "@/components/ui/icon-input"
import { Mail } from "lucide-react"

describe("IconInput", () => {
  it("renders with a left icon", () => {
    render(<IconInput leftIcon={<Mail data-testid="mail-icon" />} placeholder="Email" />)
    expect(screen.getByTestId("mail-icon")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument()
  })

  it("renders a right icon when provided", () => {
    render(
      <IconInput
        leftIcon={<Mail />}
        rightIcon={<button data-testid="toggle">toggle</button>}
        placeholder="Password"
      />
    )
    expect(screen.getByTestId("toggle")).toBeInTheDocument()
  })

  it("forwards input props", () => {
    render(<IconInput leftIcon={<Mail />} type="email" required placeholder="Email" />)
    const input = screen.getByPlaceholderText("Email")
    expect(input).toHaveAttribute("type", "email")
    expect(input).toBeRequired()
  })
})
