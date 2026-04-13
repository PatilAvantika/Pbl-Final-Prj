/** First-time field onboarding (profile → face enrollment → attendance verification). */
export function needsVolunteerOnboarding(user: {
    role: string;
    onboardingProfileComplete?: boolean;
    onboardingFaceComplete?: boolean;
    onboardingAttendanceIntroComplete?: boolean;
} | null): boolean {
    if (!user || user.role !== 'VOLUNTEER') return false;
    // Only explicit `true` counts as complete — missing/undefined must require onboarding
    return (
        user.onboardingProfileComplete !== true ||
        user.onboardingFaceComplete !== true ||
        user.onboardingAttendanceIntroComplete !== true
    );
}

/** After login/register: volunteers finish onboarding before the main app shell. */
export function getVolunteerEntryPath(user: {
    role: string;
    onboardingProfileComplete?: boolean;
    onboardingFaceComplete?: boolean;
    onboardingAttendanceIntroComplete?: boolean;
}): '/onboarding' | '/volunteer/dashboard' {
    return needsVolunteerOnboarding(user) ? '/onboarding' : '/volunteer/dashboard';
}
