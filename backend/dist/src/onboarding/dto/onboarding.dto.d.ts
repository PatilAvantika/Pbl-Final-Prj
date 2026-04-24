export declare class OnboardingProfileDto {
    firstName: string;
    lastName: string;
    phone: string;
    department: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
}
export declare class FaceSampleItemDto {
    angle: 'front' | 'left' | 'right';
    dataUrl: string;
}
export declare class FaceSamplesDto {
    samples: FaceSampleItemDto[];
}
