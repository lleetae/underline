'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/app/lib/supabase';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { Trash2, Upload, Loader2 } from 'lucide-react';

interface Review {
    id: string;
    title: string;
    book_info: string;
    detail_question: string;
    detail_answer: string;
    image_url: string;
    created_at: string;
}

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const [title, setTitle] = useState('');
    const [bookInfo, setBookInfo] = useState('');
    const [detailQuestion, setDetailQuestion] = useState('');
    const [detailAnswer, setDetailAnswer] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReviews(data || []);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            alert('후기 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedImage || !title || !bookInfo || !detailQuestion || !detailAnswer) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        try {
            setUploading(true);

            // 1. Upload Image
            const fileExt = selectedImage.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('reviews')
                .upload(fileName, selectedImage);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('reviews')
                .getPublicUrl(fileName);

            // 3. Insert Data
            const { error: insertError } = await supabase
                .from('reviews')
                .insert({
                    title,
                    book_info: bookInfo,
                    detail_question: detailQuestion,
                    detail_answer: detailAnswer,
                    image_url: publicUrl,
                });

            if (insertError) throw insertError;

            // Reset Form
            setTitle('');
            setBookInfo('');
            setDetailQuestion('');
            setDetailAnswer('');
            setSelectedImage(null);
            setPreviewUrl(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

            alert('후기가 성공적으로 등록되었습니다.');
            fetchReviews();

        } catch (error: any) {
            console.error('Error uploading review:', error);
            alert(`업로드 실패: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string, imageUrl: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            // 1. Delete Image from Storage
            // Extract filename from URL
            const fileName = imageUrl.split('/').pop();
            if (fileName) {
                await supabase.storage.from('reviews').remove([fileName]);
            }

            // 2. Delete Record from DB
            const { error } = await supabase
                .from('reviews')
                .delete()
                .eq('id', id);

            if (error) throw error;

            alert('삭제되었습니다.');
            fetchReviews();
        } catch (error) {
            console.error('Error deleting review:', error);
            alert('삭제 실패');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-gray-900">후기 관리 (Admin)</h1>

                {/* Upload Form */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">새 후기 등록</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column: Image */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    대표 사진
                                </label>
                                <div
                                    className="border-2 border-dashed border-gray-300 rounded-lg h-64 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors relative overflow-hidden bg-gray-50"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center text-gray-500">
                                            <Upload className="w-8 h-8 mx-auto mb-2" />
                                            <span className="text-sm">클릭하여 이미지 업로드</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageSelect}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            {/* Right Column: Inputs */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        제목 (후킹용 멘트)
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="예: 가벼움과 무거움 사이에서 만난 인연"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        책 정보
                                    </label>
                                    <input
                                        type="text"
                                        value={bookInfo}
                                        onChange={(e) => setBookInfo(e.target.value)}
                                        placeholder="예: 참을 수 없는 존재의 가벼움"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        상세 질문
                                    </label>
                                    <input
                                        type="text"
                                        value={detailQuestion}
                                        onChange={(e) => setDetailQuestion(e.target.value)}
                                        placeholder="예: 가장 인상 깊었던 구절은?"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        상세 답변
                                    </label>
                                    <textarea
                                        value={detailAnswer}
                                        onChange={(e) => setDetailAnswer(e.target.value)}
                                        placeholder="답변 내용을 입력하세요..."
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={uploading}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {uploading ? '등록 중...' : '후기 등록하기'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* List */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-xl font-semibold text-gray-800">등록된 후기 목록</h2>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-gray-500">로딩 중...</div>
                    ) : reviews.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">등록된 후기가 없습니다.</div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {reviews.map((review) => (
                                <li key={review.id} className="p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                                    <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                        <ImageWithFallback
                                            src={review.image_url}
                                            alt={review.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded">
                                                {review.book_info}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(review.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                                            {review.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                                            Q. {review.detail_question}
                                        </p>
                                        <p className="text-sm text-gray-500 line-clamp-2">
                                            {review.detail_answer}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(review.id, review.image_url)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="삭제"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
