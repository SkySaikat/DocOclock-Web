import React from 'react';
import { MaskIcon } from '../dashboard/MaskIcon';
import { OV_ICONS } from '../doctor/overview/assets';

interface DoctorDashboardProfileProps {
    /**
     * `bmdcNumber`, `experience`, `rating` and `totalPatients` are still accepted (the data shape is unchanged) but the Figma
     * Doctor Overview profile card only shows photo, name, Designation and Active hospital, so they are no longer rendered.
     */
    doctor: {
        name: string;
        specialty: string;
        bmdcNumber: string;
        experience?: string | number;
        rating?: number;
        totalPatients?: number;
        image?: string;
        hospitalName?: string;
    };
    onManageClick?: () => void;
    /** The arrow button next to the name (Figma 339:17434 -> Doctor Profile). Falls back to `onManageClick` when omitted. */
    onProfileClick?: () => void;
}

/**
 * Doctor Overview profile card (Figma 339:17429, phone 572:26138): white r32 card, pad 24, photo + name/arrow + Designation / Active.
 * Desktop (lg): 388 wide column — photo 298 high on top, contents below. Phone / tablet: photo (228 high) left, contents right.
 */
export const DoctorDashboardProfile: React.FC<DoctorDashboardProfileProps> = ({
    doctor,
    onManageClick,
    onProfileClick
}) => {
    const openProfile = onProfileClick ?? onManageClick;

    return (
        // Figma drop-shadow(0 -1px 6px rgba(0,0,0,.04)) on the card = this box-shadow (no token: ds-rise is blur 12).
        <section
            aria-label="Doctor profile"
            className="w-full bg-white rounded-ds-xl p-6 shadow-[0_-1px_6px_0_rgba(0,0,0,0.04)] flex gap-6 lg:flex-col lg:w-[388px] lg:shrink-0 lg:min-h-[513px]"
        >
            {/* Photo */}
            <div className="relative flex-1 min-w-0 h-[228px] rounded-ds-lg overflow-hidden lg:flex-none lg:w-full lg:h-[298px]">
                {doctor.image ? (
                    <img
                        src={doctor.image}
                        alt={doctor.name}
                        className="absolute inset-0 size-full object-cover"
                    />
                ) : (
                    <div className="size-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                        <span className="text-white font-display text-[96px] leading-none">{(doctor.name || '?').charAt(0)}</span>
                    </div>
                )}
            </div>

            {/* Contents */}
            <div className="flex-1 min-w-0 flex flex-col gap-6 lg:gap-0 lg:justify-between">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between lg:gap-3">
                    <h2 className="min-w-0 break-words font-inter font-normal text-[24px] leading-[normal] text-content-primary lg:flex-1">
                        {doctor.name}
                    </h2>
                    <button
                        type="button"
                        onClick={openProfile}
                        aria-label="Open profile"
                        className="size-[42px] shrink-0 rounded-[21px] border border-primary-100 grid place-items-center text-content-tertiary cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                    >
                        <MaskIcon src={OV_ICONS.arrowRightUp} size={16} />
                    </button>
                </div>

                <dl className="flex flex-col gap-1 font-inter">
                    <div className="flex flex-col gap-2">
                        <dt className="text-[12px] leading-[normal] tracking-[-0.72px] text-content-secondary">Designation</dt>
                        <dd className="text-[16px] leading-[19px] tracking-[-0.32px] text-content-primary">
                            {doctor.specialty || 'General Practitioner'}
                        </dd>
                    </div>
                    <div className="flex flex-col gap-2">
                        <dt className="text-[12px] leading-[normal] tracking-[-0.72px] text-content-secondary">Active</dt>
                        <dd className="text-[16px] leading-[19px] tracking-[-0.32px] text-content-primary">
                            {doctor.hospitalName || 'Main Chamber'}
                        </dd>
                    </div>
                </dl>
            </div>
        </section>
    );
};
