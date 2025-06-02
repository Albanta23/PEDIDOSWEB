import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';

test('renderiza un título de ejemplo', () => {
  render(<h1>Panel de Control</h1>);
  expect(screen.getByText(/panel de control/i)).toBeDefined();
});
