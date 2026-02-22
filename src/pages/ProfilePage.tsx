const ProfilePage = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="h-14 border-b border-border flex items-center px-4 bg-card/50 backdrop-blur-sm">
        <h1 className="text-foreground font-semibold text-sm">Profile</h1>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-primary/20 mx-auto flex items-center justify-center">
            <span className="text-2xl text-primary font-bold">U</span>
          </div>
          <h2 className="text-foreground font-semibold">Your Profile</h2>
          <p className="text-muted-foreground text-sm max-w-xs">Sign in to sync your network across devices.</p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
