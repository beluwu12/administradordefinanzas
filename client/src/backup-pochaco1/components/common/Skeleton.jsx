import React from 'react';

const Skeleton = ({ className, ...props }) => {
    return (
        <div
            className={`animate-pulse rounded-md bg-white/5 ${className}`}
            {...props}
        />
    );
};

export default Skeleton;
