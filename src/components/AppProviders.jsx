'use client';

import { CssBaseline, GlobalStyles } from '@mui/material';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import { Provider as ReduxProvider } from 'react-redux';
import theme from '@/theme';
import store from '@/store/store';
import { YearProvider } from '@/context/YearProvider';
import { BranchProvider } from '@/context/BranchProvider';

const inputReset = (
  <GlobalStyles
    styles={{
      body: {
        backgroundColor: theme.palette.background.default,
      },
      'input[type=number]': {
        MozAppearance: 'textfield',
        appearance: 'textfield',
      },
      'input[type=number]::-webkit-outer-spin-button': {
        WebkitAppearance: 'none',
        margin: 0,
      },
      'input[type=number]::-webkit-inner-spin-button': {
        WebkitAppearance: 'none',
        margin: 0,
      },
    }}
  />
);

export default function AppProviders({ children }) {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {inputReset}
        <ReduxProvider store={store}>
          <YearProvider>
            <BranchProvider>{children}</BranchProvider>
          </YearProvider>
        </ReduxProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
