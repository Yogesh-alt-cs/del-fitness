import { motion } from "framer-motion";
import { User, Settings, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";

export default function ProfilePage() {
  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-display">
            YOUR <span className="text-gradient-primary">PROFILE</span>
          </h1>
        </motion.div>

        {/* Avatar + Info */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6 flex items-center gap-6"
        >
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
            <User className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <h2 className="font-display text-2xl text-foreground">ATHLETE</h2>
            <p className="text-muted-foreground text-sm">Set up your profile to unlock personalized features</p>
            <Button variant="hero" size="sm" className="mt-3">Edit Profile</Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl text-foreground">PROGRESS</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Connect your account to start tracking your fitness progress over time.
          </p>
        </motion.div>

        {/* Settings placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl text-foreground">SETTINGS</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Account settings, notifications, and preferences will be available after signup.
          </p>
        </motion.div>
      </div>
    </AppLayout>
  );
}
