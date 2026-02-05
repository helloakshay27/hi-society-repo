import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { fetchCrmUserGroupById } from '@/store/slices/userGroupSlice';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const HiSocGroupDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const baseUrl = localStorage.getItem('baseUrl');
  const token = localStorage.getItem('token');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupDetails, setGroupDetails] = useState<{
    name: string;
    groupmembers: any[];
  }>({
    name: '',
    groupmembers: []
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await dispatch(
          fetchCrmUserGroupById({ baseUrl, token, id: Number(id) })
        ).unwrap();
        
        console.log('Group details response:', response);
        setGroupDetails({
          name: response.name || '',
          groupmembers: response.groupmembers || []
        });
      } catch (error: any) {
        console.log(error);
        toast.error(error?.message || 'Failed to fetch group details');
        setError(error?.message || 'Failed to fetch group details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, dispatch, baseUrl, token]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">GROUP DETAILS</h1>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="text-lg">Loading group details...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          Error: {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="bg-white rounded-lg border mb-6 p-6">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-gray-200 mb-4 flex items-center justify-center border-4 border-[#C72030]">
                <div className="w-24 h-24 rounded-full bg-[#C72030]/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-[#C72030]">
                    {groupDetails.name ? groupDetails.name.charAt(0).toUpperCase() : 'G'}
                  </span>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">
                {groupDetails.name || 'Unnamed Group'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Total Members - {groupDetails.groupmembers?.length || 0}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border">
            <div className="p-6">
              {groupDetails.groupmembers && groupDetails.groupmembers.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupDetails.groupmembers.map((member, index) => (
                    <div
                      key={member.id || index}
                      className="flex flex-col p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#C72030]/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-[#C72030]">
                            {member.user?.firstname ? member.user.firstname.charAt(0).toUpperCase() : 'U'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {member.user?.firstname || ''} {member.user?.lastname || ''}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">
                            {member.user?.email || 'No email'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {member.user?.mobile || 'No mobile'}
                          </p>
                          {(member.user_flat || member.user_block) && (
                            <p className="text-sm text-gray-500 mt-1">
                              {member.user_block && `${member.user_block} - `}
                              {member.user_flat || ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center text-gray-400 py-8">
                  No members added
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HiSocGroupDetailsPage;
