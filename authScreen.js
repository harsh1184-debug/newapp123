import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../redux/authSlice";
import { Box, Button, Typography, Paper, Avatar, CircularProgress } from "@mui/material";

const AuthScreen = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  const handleGoogleLogin = () => {
    dispatch(loginUser());
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "black",
      }}
    >
      <Paper
        elevation={10}
        sx={{
          p: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          borderRadius: 4,
          maxWidth: 400,
          width: "90%",
        }}
      >
        <Box
          sx={{
            width: 90,
            height: 90,
            borderRadius: "50%",
            bgcolor: "#25D366",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src="data:image/png;base64,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"
            alt="WhatsApp"
          />
        </Box>
        <Typography variant="h4" fontWeight="bold" sx={{ color: "#075E54", fontSize: 36, mt: 5 }}>
          WhatsApp
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          Sign in to send and receive messages.
        </Typography>
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={handleGoogleLogin}
          disabled={loading}
          sx={{
            mt: 2,
            py: 1.5,
            bgcolor: "#FFFFFF",
            color: "#1f1f1f",
            borderColor: "#747775",
            "&:hover": { bgcolor: "#F8F9FA", borderColor: "#747775" },
            borderRadius: 2,
            textTransform: "none",
            fontSize: 16,
            fontWeight: 500,
          }}
          startIcon={
            loading ? (
              <CircularProgress size={24} />
            ) : (
              <Avatar
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                sx={{ width: 24, height: 24, bgcolor: "transparent" }}
              />
            )
          }
        >
          {loading ? "Signing in..." : "Sign in with Google"}
        </Button>
        <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
          By signing in, you agree to our Terms & Privacy Policy.
        </Typography>
      </Paper>
    </Box>
  );
};

export default AuthScreen;