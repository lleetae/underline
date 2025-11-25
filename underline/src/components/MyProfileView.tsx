import React, { useState } from "react";
import { Plus, Edit3, User, LogOut, MapPin, Book as BookIcon } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { MyBookDetailView } from "./MyBookDetailView";
import { AddBookView } from "./AddBookView";
import { ProfileEditView } from "./ProfileEditView";
import { toast } from "sonner@2.0.3";

interface Book {
  id: string;
  title: string;
  author: string;
  publisher?: string;
  cover: string;
  reviewPreview: string;
  review: string;
}

export function MyProfileView({ onLogout }: { onLogout?: () => void }) {
  const [books, setBooks] = useState<Book[]>([
    {
      id: "1",
      title: "참을 수 없는 존재의 가벼움",
      author: "밀란 쿤데라",
      publisher: "민음사",
      cover: "https://image.aladin.co.kr/product/46/25/cover/8937462516_1.jpg",
      reviewPreview: "가벼움과 무거움 사이에서 우리는 무엇을 선택해야 할까. 테레사와 토마시의 사랑은...",
      review: "가벼움과 무거움 사이에서 우리는 무엇을 선택해야 할까. 테레사와 토마시의 사랑은 우리에게 질문을 던진다.\\n\\n존재의 가벼움이란 무엇인가? 쿤데라는 니체의 영원회귀 사상을 통해 이를 탐구한다. 만약 우리의 삶이 무한히 반복된다면, 그 삶은 견딜 수 없을 만큼 무거워질 것이다. 하지만 우리의 삶은 단 한 번뿐이고, 그렇기에 가볍다. 이 가벼움은 우리를 자유롭게도 하지만, 동시에 책임으로부터 도피하게도 만든다.\\n\\n토마시는 이 가벼움을 추구하는 인물이다. 그는 여러 여자와 관계를 맺으면서도 어떤 무게도 지려 하지 않는다. 반면 테레사는 무거움을 선택한다. 그녀는 토마시를 사랑하고, 그 사랑의 무게를 온전히 받아들인다.\\n\\n이 소설을 읽으며 나는 내 삶의 선택들을 돌아보게 되었다. 나는 가벼움을 추구하는가, 아니면 무거움을 선택하는가? 어쩌면 우리는 둘 사이를 끊임없이 오가는 존재인지도 모른다."
    },
    {
      id: "2",
      title: "데미안",
      author: "헤르만 헤세",
      publisher: "민음사",
      cover: "https://image.aladin.co.kr/product/46/8/cover/8937460882_1.jpg",
      reviewPreview: "새는 알에서 나오려고 투쟁한다. 알은 세계다. 태어나려는 자는...",
      review: "새는 알에서 나오려고 투쟁한다. 알은 세계다. 태어나려는 자는 하나의 세계를 파괴하지 않으면 안 된다.\\n\\n싱클레어의 성장 이야기는 곧 나의 이야기였다. 어린 시절 나를 지배했던 두려움, 선과 악의 경계에서 느꼈던 혼란, 진정한 나를 찾아가는 과정의 고통과 환희.\\n\\n데미안은 싱클레어에게 길잡이가 되어준다. 하지만 그는 답을 주지 않는다. 단지 질문을 던질 뿐이다. '당신은 누구인가?' '당신이 진정 원하는 것은 무엇인가?'\\n\\n이 소설을 처음 읽은 것은 스무 살 때였다. 그때 나는 나 자신을 찾고 싶었지만 어떻게 찾아야 할지 몰랐다. 데미안은 내게 그 방법을 알려주었다. 바로 내 안의 목소리에 귀 기울이는 것.\\n\\n지금도 가끔 이 책을 펼쳐본다. 그리고 매번 새로운 문장이 내게 말을 건다. 좋은 책이란 이런 것이 아닐까. 시간이 흘러도 여전히 우리에게 질문을 던지는 책."
    },
    {
      id: "3",
      title: "1984",
      author: "조지 오웰",
      publisher: "민음사",
      cover: "https://image.aladin.co.kr/product/46/7/cover/8937460777_1.jpg",
      reviewPreview: "빅 브라더가 당신을 지켜보고 있다. 전체주의 사회에서의 개인의 자유란...",
      review: "빅 브라더가 당신을 지켜보고 있다. 이 문장만큼 오싹한 경고가 또 있을까.\\n\\n오웰이 그린 1984년의 세계는 과거의 이야기가 아니다. 오히려 현재와 미래에 대한 경고다. 감시 사회, 사상 통제, 역사 왜곡. 이 모든 것이 지금 우리 주변에서 일어나고 있지 않은가.\\n\\n윈스턴의 저항은 처음부터 실패할 운명이었다. 하지만 그는 저항해야만 했다. 인간이기 때문에. '2+2=4'라는 진실을 지키기 위해, 사랑할 권리를 지키기 위해.\\n\\n이 책을 읽고 나면 세상을 다르게 보게 된다. 뉴스를 볼 때, SNS를 할 때, CCTV를 지날 때. 우리는 정말 자유로운가? 아니면 우리가 자유롭다고 믿도록 길들여진 것인가?"
    },
    {
      id: "4",
      title: "노르웨이의 숲",
      author: "무라카미 하루키",
      publisher: "민음사",
      cover: "https://image.aladin.co.kr/product/59/45/cover/8937461676_1.jpg",
      reviewPreview: "죽음과 상실, 그리고 사랑에 대한 이야기. 와타나베의 청춘은...",
      review: "비틀즈의 'Norwegian Wood'가 흐르면 나는 와타나베가 된다.\\n\\n이 소설은 상실에 대한 이야기다. 나오코를 잃고, 기즈키를 잃고, 자신의 청춘을 잃어가는 와타나베. 그는 구원받을 수 있을까.\\n\\n미도리는 생명력 그 자체다. 나오코의 죽음과 대비되는 미도리의 활력. 하루키는 이 두 여인을 통해 삶과 죽음, 과거와 현재를 대비시킨다.\\n\\n이 책을 읽을 때마다 나는 스무 살의 나를 떠올린다. 그때의 혼란스러움, 외로움, 그리고 절실했던 사랑. 청춘이란 이런 것이 아니었을까. 아프지만 아름다운."
    },
    {
      id: "5",
      title: "백년의 고독",
      author: "가브리엘 가르시아 마르케스",
      publisher: "민음사",
      cover: "https://image.aladin.co.kr/product/46/1/cover/8937461005_1.jpg",
      reviewPreview: "부엔디아 가문의 7대에 걸친 대서사시. 마술적 사실주의의 정점...",
      review: "마콘도라는 마을에서 시작된 부엔디아 가문의 100년. 이것은 단순한 가족사가 아니다. 라틴 아메리카의 역사이자, 인류 문명의 축소판이다.\\n\\n마르케스의 마술적 사실주의는 환상과 현실의 경계를 무너뜨린다. 승천하는 레메디오스, 끝없이 내리는 비, 죽은 자와 대화하는 살아있는 자들. 이 모든 것이 자연스럽게 받아들여진다.\\n\\n이 소설의 진정한 주제는 고독이다. 반복되는 이름들, 반복되는 운명. 부엔디아 가문의 모든 이들은 각자의 방식으로 고독하다. 그리고 그 고독은 대물림된다.\\n\\n100년의 끝에서 우리는 깨닫는다. 역사는 반복되고, 인간은 변하지 않는다는 것을. 하지만 그럼에도 우리는 살아가야 한다."
    },
    {
      id: "6",
      title: "호밀밭의 파수꾼",
      author: "J.D. 샐린저",
      publisher: "민음사",
      cover: "https://image.aladin.co.kr/product/46/7/cover/8937460750_1.jpg",
      reviewPreview: "홀든 콜필드의 방황. 어른이 되기 싫은 소년의 절규...",
      review: "홀든 콜필드는 우리 모두였다. 적어도 한때는.\\n\\n그는 세상의 위선을 견딜 수 없다. 가식적인 어른들, 거짓말쟁이들, 'phony'한 사람들. 그래서 그는 도망친다. 하지만 어디로?\\n\\n호밀밭의 파수꾼이 되고 싶다는 홀든의 꿈. 절벽으로 떨어질 뻔한 아이들을 잡아주는 사람. 그것은 순수함을 지키고 싶다는 그의 간절한 소망이다.\\n\\n하지만 동생 피비는 알고 있다. 홀든도 알고 있다. 우리는 자랄 수밖에 없다는 것을. 순수함은 언젠가 사라진다는 것을.\\n\\n이 소설을 읽고 나면 홀든이 미워질 수도, 사랑스러워질 수도 있다. 하지만 무관심할 수는 없다. 그는 너무나 솔직하고, 너무나 인간적이니까."
    },
    {
      id: "7",
      title: "이방인",
      author: "알베르 카뮈",
      publisher: "민음사",
      cover: "https://image.aladin.co.kr/product/59/43/cover/8937460645_1.jpg",
      reviewPreview: "오늘 엄마가 죽었다. 어쩌면 어제였을지도 모른다. 뫼르소의 무관심과...",
      review: "오늘 엄마가 죽었다. 어쩌면 어제였을지도 모른다.\\n\\n이 유명한 첫 문장부터 뫼르소는 우리를 불편하게 만든다. 그의 무관심, 무감동. 엄마의 장례식에서도, 연인과의 관계에서도, 심지어 살인을 저지른 후에도.\\n\\n하지만 정말 뫼르소가 이상한 걸까? 아니면 그가 너무 정직한 걸까? 우리는 모두 슬픈 척, 행복한 척, 후회하는 척 연기하며 살아간다. 뫼르소는 그것을 거부한 것뿐이다.\\n\\n재판정에서 뫼르소는 유죄 판결을 받는다. 살인 때문이 아니라, 엄마의 장례식에서 울지 않았기 때문에. 사회는 감정을 표현하지 않는 자를 용서하지 않는다.\\n\\n단두대를 앞두고 뫼르소는 마침내 깨닫는다. 세상의 부조리함을, 그리고 그럼에도 살아야 한다는 것을."
    },
    {
      id: "8",
      title: "죄와 벌",
      author: "표도르 도스토옙스키",
      publisher: "민음사",
      cover: "https://image.aladin.co.kr/product/1/47/cover/8937460645_2.jpg",
      reviewPreview: "라스콜리니코프의 범죄와 그 이후. 양심과 구원에 대한 탐구...",
      review: "라스콜리니코프는 스스로에게 질문한다. 나는 특별한 인간인가? 범죄를 저질러도 되는 인간인가?\\n\\n그는 전당포 노파를 살해한다. 세상에 쓸모없는 인간이라고 판단했기 때문에. 하지만 살인 후 그는 무너진다. 양심의 가책, 공포, 편집증.\\n\\n도스토옙스키는 인간의 내면을 파고든다. 라스콜리니코프의 고뇌, 소냐의 희생적 사랑, 포르피리의 심리적 압박. 모든 캐릭터가 살아 숨 쉰다.\\n\\n소냐는 창녀지만 성녀다. 그녀는 라스콜리니코프에게 자수를 권한다. 벌을 받음으로써만 구원받을 수 있다고. 그리고 그는 시베리아 유형지에서 마침내 부활한다.\\n\\n이 소설은 묻는다. 인간은 악을 행하고도 평온할 수 있는가? 아니다. 양심은 우리를 놓아주지 않는다."
    },
    {
      id: "9",
      title: "위대한 개츠비",
      author: "F. 스콧 피츠제럴드",
      publisher: "민음사",
      cover: "https://image.aladin.co.kr/product/2/41/cover/8937460807_1.jpg",
      reviewPreview: "제이 개츠비의 아메리칸 드림. 화려한 파티 뒤에 숨겨진 슬픔...",
      review: "녹색 불빛. 개츠비는 매일 밤 그것을 바라본다. 데이지의 집 끝에 있는 부두의 녹색 불빛. 그것은 그의 꿈이자, 동시에 도달할 수 없는 것의 상징이다.\\n\\n개츠비는 모든 것을 가졌다. 부, 명예, 화려한 저택. 하지만 그가 진정 원한 것은 오직 하나. 과거로 돌아가는 것. 데이지를 처음 만났던 그때로.\\n\\n하지만 과거는 돌아오지 않는다. 데이지는 더 이상 그 순수했던 소녀가 아니다. 그녀는 부유하고 냉소적인 상류층 여인일 뿐이다.\\n\\n개츠비의 죽음은 아메리칸 드림의 죽음이다. 노력하면 무엇이든 이룰 수 있다는 환상. 하지만 현실은 잔인하다. 계급은 쉽게 넘을 수 없고, 과거는 돌아오지 않는다.\\n\\n그래도 우리는 개츠비를 사랑한다. 그의 순수한 열정을, 끝없는 희망을."
    },
  ]);

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showAddBookView, setShowAddBookView] = useState(false);
  const [showProfileEditView, setShowProfileEditView] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Profile Data State
  const [profileData, setProfileData] = useState({
    nickname: "책읽는사람",
    gender: "여성",
    birthDate: "1995.03.15",
    location: "seoul",
    religion: "none",
    height: "165",
    smoking: "non-smoker",
    drinking: "social",
    bio: "책과 커피, 그리고 조용한 오후를 사랑합니다. 깊이 있는 대화를 나눌 수 있는 사람을 찾고 있어요.",
    kakaoId: "example_kakao",
    profilePhotos: [
      { id: "1", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330" },
      { id: "2", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d" },
      { id: "3", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb" },
    ],
  });

  // Location mapping
  const locationMap: { [key: string]: string } = {
    seoul: "서울",
    busan: "부산",
    incheon: "인천",
    daegu: "대구",
    daejeon: "대전",
    gwangju: "광주",
    ulsan: "울산",
    sejong: "세종",
    gyeonggi: "경기",
    other: "기타",
  };

  // Show book detail view if a book is selected
  if (selectedBook) {
    return (
      <MyBookDetailView
        book={selectedBook}
        onBack={() => setSelectedBook(null)}
        onUpdate={(updatedReview) => {
          setBooks(books.map(b => 
            b.id === selectedBook.id 
              ? { ...b, review: updatedReview, reviewPreview: updatedReview.split('\n')[0].slice(0, 80) + "..." }
              : b
          ));
          setSelectedBook({ ...selectedBook, review: updatedReview });
        }}
        onDelete={() => {
          setBooks(books.filter(b => b.id !== selectedBook.id));
          setSelectedBook(null);
        }}
      />
    );
  }

  // Show add book view if add book button is clicked
  if (showAddBookView) {
    return (
      <AddBookView
        onComplete={(newBookData) => {
          const newBook: Book = {
            id: (books.length + 1).toString(),
            title: newBookData.title,
            author: newBookData.author,
            publisher: newBookData.publisher,
            cover: newBookData.cover,
            review: newBookData.review,
            reviewPreview: newBookData.review.split('\n')[0].slice(0, 80) + "..."
          };
          setBooks([...books, newBook]);
          setShowAddBookView(false);
          toast.success("책이 추가되었습니다");
        }}
        onBack={() => setShowAddBookView(false)}
      />
    );
  }

  // Show profile edit view if edit profile button is clicked
  if (showProfileEditView) {
    return (
      <ProfileEditView
        profileData={profileData}
        onBack={() => setShowProfileEditView(false)}
        onSave={(updatedData) => {
          setProfileData(updatedData);
          setShowProfileEditView(false);
        }}
      />
    );
  }

  const handleLogout = () => {
    setShowLogoutModal(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className="w-full max-w-md relative shadow-2xl shadow-black/5 min-h-screen bg-[#FCFCFA] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#FCFCFA] border-b border-[#1A3C34]/10">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="font-serif text-2xl text-[#1A3C34]">My Profile</h1>
          <button 
            onClick={() => setShowLogoutModal(true)}
            className="p-2 hover:bg-[#1A3C34]/5 rounded-full transition-colors"
          >
            <LogOut className="w-5 h-5 text-[#1A3C34]" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Profile Summary Card */}
        <div className="px-6 pt-6 pb-4">
          <div className="bg-gradient-to-br from-[#FCFCFA] to-[#F5F5F0] border-2 border-[#D4AF37]/20 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              {/* Profile Photo */}
              {profileData.profilePhotos.length > 0 ? (
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#D4AF37]/30 flex-shrink-0">
                  <ImageWithFallback
                    src={profileData.profilePhotos[0].url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border-2 border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0">
                  <User className="w-10 h-10 text-[#D4AF37]/40" />
                </div>
              )}
              
              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <h2 className="font-serif text-xl text-[#1A3C34] mb-1">
                  {profileData.nickname}
                </h2>
                <div className="flex items-center gap-3 text-xs text-[#1A3C34]/60 font-sans">
                  <span>{profileData.gender}</span>
                  <span>·</span>
                  <span>{profileData.birthDate.substring(0, 4)}년생</span>
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="text-xs text-[#1A3C34]/70 font-sans">
                    {locationMap[profileData.location]}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio Preview */}
            <div className="mb-4">
              <p className="text-sm text-[#1A3C34]/80 font-sans leading-relaxed line-clamp-2">
                {profileData.bio}
              </p>
            </div>

            {/* Edit Profile Button */}
            <button
              onClick={() => setShowProfileEditView(true)}
              className="w-full bg-white border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white font-sans font-medium py-2.5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              프로필 수정하기
            </button>
          </div>
        </div>

        {/* My Library */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-[#1A3C34]">My Library</h2>
            <div className="flex items-center gap-1.5 text-sm text-[#1A3C34]/60 font-sans">
              <BookIcon className="w-4 h-4" />
              <span>{books.length}권</span>
            </div>
          </div>
          
          {/* 3x3 Grid Layout */}
          <div className="grid grid-cols-3 gap-3">
            {/* Add New Book Button - First Position */}
            <button
              onClick={() => setShowAddBookView(true)}
              className="aspect-[2/3] border-2 border-dashed border-[#D4AF37] rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-[#D4AF37]/5 transition-colors"
            >
              <Plus className="w-6 h-6 text-[#D4AF37]" />
              <span className="text-xs text-[#D4AF37] font-sans">책 추가</span>
            </button>

            {/* Books */}
            {books.map((book) => (
              <button
                key={book.id}
                className="aspect-[2/3] rounded-lg overflow-hidden border border-[#1A3C34]/10 hover:border-[#D4AF37] hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedBook(book)}
              >
                <ImageWithFallback
                  src={book.cover}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          {/* Library Stats */}
          <div className="mt-6 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-lg p-4">
            <p className="text-xs text-center text-[#1A3C34]/70 font-sans leading-relaxed">
              책을 추가하면 다른 사람들에게 당신의 취향이 공개되며,<br />
              <span className="text-[#D4AF37]">더 잘 맞는 매칭을 찾을 수 있습니다</span>
            </p>
          </div>
        </div>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-[#FCFCFA] p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-[#1A3C34]/10">
            <h2 className="font-serif text-xl text-[#1A3C34] mb-3">
              정말 로그아웃하시나요?
            </h2>
            <p className="text-sm text-[#1A3C34]/70 font-sans mb-6 leading-relaxed">
              로그아웃하시면 진행 중인 매칭 신청과<br />
              받은 메시지를 확인할 수 없습니다.<br />
              <span className="text-[#D4AF37]">혹시 모를 인연을 놓치실 수도 있어요.</span>
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-3.5 bg-[#D4AF37] text-white font-sans rounded-lg hover:bg-[#D4AF37]/90 transition-all duration-300 shadow-sm"
              >
                계속 사용하기
              </button>
              <button
                onClick={handleLogout}
                className="w-full py-3 border border-[#1A3C34]/20 text-[#1A3C34]/60 font-sans rounded-lg hover:bg-[#1A3C34]/5 transition-colors text-sm"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}