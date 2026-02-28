// Admin verification utilities
export const EXPECTED_ADMIN = {
  address: 'GAZ27SJ7YFLUGO2O4JCTOWLNNXQZ5C7H5A7WFWEBALT6F6JELKJKNV44',
  secret: 'SBWOC4AQIWYJOR7J3MZTDYVAUZP2XBW7WVH4EXKMLTGQEOZIURA5JAL2'
};

export const verifyAdmin = async (publicKey: string) => {
  const isAdmin = publicKey === EXPECTED_ADMIN.address;
  
  return {
    isAdmin,
    adminAddress: EXPECTED_ADMIN.address,
    connectedAddress: publicKey,
    message: isAdmin ? 'Admin verified' : 'Not admin'
  };
};

export const isAdminConnected = (publicKey: string | null): boolean => {
  return publicKey === EXPECTED_ADMIN.address;
};